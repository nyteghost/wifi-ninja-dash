import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Settings as Gear, Wifi, WifiOff, Moon, Timer, Users, X, RefreshCw } from "lucide-react";
import {
  DEFAULT_SETTINGS, getResumeAt, getStatus, loadSettings, nextMorning, saveSettings,
  setEnabled, setResumeAt, type Settings, type Status,
} from "@/lib/unifi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turbo Ninja Wi-Fi — Kids Network Control" },
      { name: "description", content: "Toggle and pause the Turbo Ninja Kids Wi-Fi on your UniFi network." },
      { property: "og:title", content: "Turbo Ninja Wi-Fi" },
      { property: "og:description", content: "One-tap control of the kids' Wi-Fi network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function fmt(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function Index() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeAt, setResume] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setResume(getResumeAt());
  }, []);

  const refresh = useCallback(async (s = settings) => {
    try {
      setError(null);
      setStatus(await getStatus(s));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [settings]);

  useEffect(() => { refresh(); const i = setInterval(() => refresh(), 15000); return () => clearInterval(i); }, [refresh]);

  const apply = async (enabled: boolean, until: number | null = null) => {
    setBusy(true);
    setStatus((s) => (s ? { ...s, enabled } : s));
    try {
      await setEnabled(settings, enabled, status?.wlanId);
      setResumeAt(until); setResume(until);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally { setBusy(false); }
  };

  // timer tick + auto-resume
  useEffect(() => {
    const i = setInterval(() => {
      const t = Date.now(); setNow(t);
      if (resumeAt && t >= resumeAt && !busy) apply(true, null);
    }, 1000);
    return () => clearInterval(i);
  });

  const on = status?.enabled ?? false;
  const loading = !status && !error;

  return (
    <div className="min-h-screen bg-background pb-12" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center justify-between pt-6 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {settings.mode === "demo" ? "Demo mode" : "Live · UniFi"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Kids Wi-Fi</h1>
          </div>
          <button aria-label="Settings" onClick={() => setOpen(true)} className="rounded-full bg-card p-2.5 shadow-sm">
            <Gear className="h-5 w-5 text-foreground" />
          </button>
        </header>

        {/* Master toggle card */}
        <section className="rounded-3xl bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${on ? "bg-success text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {on ? <Wifi className="h-7 w-7" /> : <WifiOff className="h-7 w-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-foreground">{settings.ssid}</p>
              <p className={`text-sm font-medium ${on ? "text-success" : "text-muted-foreground"}`}>
                {loading ? "Checking…" : busy ? "Updating…" : on ? "Online" : resumeAt ? `Paused · back in ${fmt(resumeAt - now)}` : "Off"}
              </p>
            </div>
          </div>
          <button
            role="switch" aria-checked={on} disabled={busy || loading}
            onClick={() => apply(!on)}
            className={`mt-6 flex h-20 w-full items-center rounded-full p-2 transition-colors duration-300 disabled:opacity-60 ${on ? "bg-success flex-row-reverse" : "bg-muted"}`}
          >
            <span className="h-16 w-16 shrink-0 rounded-full bg-card shadow-md" />
            <span className={`flex-1 text-center text-lg font-semibold ${on ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {on ? "Wi-Fi on" : "Wi-Fi off"}
            </span>
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{on ? "Tap to turn off" : "Tap to turn on"}</p>
        </section>

        {/* Timers */}
        <h2 className="mt-8 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick pause</h2>
        <section className="grid grid-cols-3 gap-3">
          {[{ l: "30 min", ms: 30 * 60000, i: Timer }, { l: "1 hour", ms: 60 * 60000, i: Timer }].map((o) => (
            <button key={o.l} disabled={busy} onClick={() => apply(false, Date.now() + o.ms)}
              className="flex flex-col items-center gap-1 rounded-2xl bg-card py-4 shadow-sm active:scale-95 transition-transform">
              <o.i className="h-5 w-5 text-primary" /><span className="text-sm font-medium text-foreground">{o.l}</span>
            </button>
          ))}
          <button disabled={busy} onClick={() => apply(false, nextMorning(7))}
            className="flex flex-col items-center gap-1 rounded-2xl bg-card py-4 shadow-sm active:scale-95 transition-transform">
            <Moon className="h-5 w-5 text-primary" /><span className="text-sm font-medium text-foreground">Bedtime</span>
          </button>
        </section>
        {resumeAt && (
          <button onClick={() => apply(true, null)} className="mt-3 w-full rounded-2xl bg-card py-3 text-sm font-semibold text-primary shadow-sm">
            Cancel pause & turn on now
          </button>
        )}

        {/* Clients */}
        <div className="mt-8 mb-2 flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connected devices</h2>
          <button aria-label="Refresh" onClick={() => refresh()}><RefreshCw className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <section className="overflow-hidden rounded-3xl bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <Users className="h-5 w-5 text-primary" />
            <span className="flex-1 font-medium text-foreground">Devices online</span>
            <span className="text-2xl font-bold text-foreground">{status?.clients.length ?? "–"}</span>
          </div>
          {status?.clients.map((c) => (
            <div key={c.name} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
              <div><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.ip}</p></div>
              {c.signal != null && <span className="text-xs text-muted-foreground">{c.signal} dBm</span>}
            </div>
          ))}
          {status && !status.clients.length && <p className="px-5 py-4 text-sm text-muted-foreground">No devices connected.</p>}
        </section>

        {error && <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Pause timers resume while this app is open. Add to Home Screen via Share → “Add to Home Screen”.
        </p>
      </div>

      {open && <SettingsSheet initial={settings} onClose={() => setOpen(false)}
        onSave={(s) => { saveSettings(s); setSettings(s); setStatus(null); setOpen(false); refresh(s); }} />}
    </div>
  );
}

function SettingsSheet({ initial, onClose, onSave }: { initial: Settings; onClose: () => void; onSave: (s: Settings) => void }) {
  const [s, set] = useState(initial);
  const field = "mt-1 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <button aria-label="Close" onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="mb-4 grid grid-cols-3 rounded-xl bg-muted p-1 text-sm">
          {(["demo", "local", "cloud"] as const).map((m) => (
            <button key={m} onClick={() => set({ ...s, mode: m })}
              className={`rounded-lg py-2 font-medium capitalize ${s.mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {m === "local" ? "Controller" : m === "cloud" ? "Proxy URL" : "Demo"}
            </button>
          ))}
        </div>
        {s.mode !== "demo" && (
          <div className="space-y-3">
            <label className="block text-sm text-muted-foreground">{s.mode === "local" ? "Console address" : "Network API base URL"}
              <input className={field} placeholder={s.mode === "local" ? "https://192.168.1.1" : "https://proxy.example.com"} value={s.endpoint} onChange={(e) => set({ ...s, endpoint: e.target.value })} /></label>
            <label className="block text-sm text-muted-foreground">API key
              <input type="password" className={field} value={s.apiKey} onChange={(e) => set({ ...s, apiKey: e.target.value })} /></label>
            <label className="block text-sm text-muted-foreground">Site
              <input className={field} value={s.site} onChange={(e) => set({ ...s, site: e.target.value })} /></label>
          </div>
        )}
        <label className="mt-3 block text-sm text-muted-foreground">Wi-Fi name
          <input className={field} value={s.ssid} onChange={(e) => set({ ...s, ssid: e.target.value })} /></label>
        <p className="mt-3 text-xs text-muted-foreground">Saved only on this device. Create an API key in UniFi Network → Settings → Control Plane → Integrations.</p>
        <button onClick={() => onSave(s)} className="mt-5 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground">Save</button>
      </div>
    </div>
  );
}

export type Settings = {
  mode: "demo" | "local" | "cloud";
  endpoint: string; // e.g. https://192.168.1.1 (UniFi OS console)
  apiKey: string;
  site: string;
  ssid: string;
};

export const DEFAULT_SETTINGS: Settings = {
  mode: "demo",
  endpoint: "",
  apiKey: "",
  site: "default",
  ssid: "Turbo Ninja Kids",
};

const KEY = "tnk-settings";
export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export type Client = { name: string; ip?: string; signal?: number };
export type Status = { enabled: boolean; clients: Client[]; wlanId?: string };

// ---------- Demo ----------
const DEMO_CLIENTS: Client[] = [
  { name: "Leo's iPad", ip: "192.168.20.14", signal: -52 },
  { name: "Mia's Switch", ip: "192.168.20.22", signal: -61 },
  { name: "Kids-Chromebook", ip: "192.168.20.31", signal: -58 },
];
let demoEnabled = true;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Live (UniFi Network API via API key) ----------
function base(s: Settings) {
  if (s.mode === "cloud") return s.endpoint.replace(/\/$/, ""); // proxy URL supplied by user
  return `${s.endpoint.replace(/\/$/, "")}/proxy/network`;
}
async function api(s: Settings, path: string, init?: RequestInit) {
  const res = await fetch(`${base(s)}/api/s/${s.site}${path}`, {
    ...init,
    headers: { "X-API-KEY": s.apiKey, Accept: "application/json", "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Controller replied ${res.status}: ${await res.text()}`);
  return (await res.json()).data as any[];
}

export async function getStatus(s: Settings): Promise<Status> {
  if (s.mode === "demo") {
    await wait(300);
    return { enabled: demoEnabled, clients: demoEnabled ? DEMO_CLIENTS : [] };
  }
  const wlans = await api(s, "/rest/wlanconf");
  const w = wlans.find((x) => x.name === s.ssid);
  if (!w) throw new Error(`Network "${s.ssid}" not found on controller`);
  const sta = await api(s, "/stat/sta");
  const clients = sta
    .filter((c) => c.essid === s.ssid)
    .map((c) => ({ name: c.name || c.hostname || c.mac, ip: c.ip, signal: c.signal }));
  return { enabled: !!w.enabled, clients, wlanId: w._id };
}

export async function setEnabled(s: Settings, enabled: boolean, wlanId?: string) {
  if (s.mode === "demo") {
    await wait(600);
    demoEnabled = enabled;
    return;
  }
  let id = wlanId;
  if (!id) id = (await getStatus(s)).wlanId;
  await api(s, `/rest/wlanconf/${id}`, { method: "PUT", body: JSON.stringify({ enabled }) });
}

// ---------- Timers ----------
const TKEY = "tnk-resume-at";
export const getResumeAt = () => Number(localStorage.getItem(TKEY) || 0) || null;
export const setResumeAt = (t: number | null) =>
  t ? localStorage.setItem(TKEY, String(t)) : localStorage.removeItem(TKEY);

export function nextMorning(hour = 7, now = new Date()) {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

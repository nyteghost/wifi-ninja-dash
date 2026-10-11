import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as Timer, c as Moon, i as Users, n as Wifi, o as Settings, r as WifiOff, s as RefreshCw, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dp16SzVX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_SETTINGS = {
	mode: "demo",
	endpoint: "",
	apiKey: "",
	site: "default",
	ssid: "Turbo Ninja Kids"
};
var KEY = "tnk-settings";
function loadSettings() {
	try {
		return {
			...DEFAULT_SETTINGS,
			...JSON.parse(localStorage.getItem(KEY) || "{}")
		};
	} catch {
		return DEFAULT_SETTINGS;
	}
}
function saveSettings(s) {
	localStorage.setItem(KEY, JSON.stringify(s));
}
var DEMO_CLIENTS = [
	{
		name: "Leo's iPad",
		ip: "192.168.20.14",
		signal: -52
	},
	{
		name: "Mia's Switch",
		ip: "192.168.20.22",
		signal: -61
	},
	{
		name: "Kids-Chromebook",
		ip: "192.168.20.31",
		signal: -58
	}
];
var demoEnabled = true;
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
function base(s) {
	if (s.mode === "cloud") return s.endpoint.replace(/\/$/, "");
	return `${s.endpoint.replace(/\/$/, "")}/proxy/network`;
}
async function api(s, path, init) {
	const res = await fetch(`${base(s)}/api/s/${s.site}${path}`, {
		...init,
		headers: {
			"X-API-KEY": s.apiKey,
			Accept: "application/json",
			"Content-Type": "application/json"
		}
	});
	if (!res.ok) throw new Error(`Controller replied ${res.status}: ${await res.text()}`);
	return (await res.json()).data;
}
async function getStatus(s) {
	if (s.mode === "demo") {
		await wait(300);
		return {
			enabled: demoEnabled,
			clients: demoEnabled ? DEMO_CLIENTS : []
		};
	}
	const w = (await api(s, "/rest/wlanconf")).find((x) => x.name === s.ssid);
	if (!w) throw new Error(`Network "${s.ssid}" not found on controller`);
	const clients = (await api(s, "/stat/sta")).filter((c) => c.essid === s.ssid).map((c) => ({
		name: c.name || c.hostname || c.mac,
		ip: c.ip,
		signal: c.signal
	}));
	return {
		enabled: !!w.enabled,
		clients,
		wlanId: w._id
	};
}
async function setEnabled(s, enabled, wlanId) {
	if (s.mode === "demo") {
		await wait(600);
		demoEnabled = enabled;
		return;
	}
	let id = wlanId;
	if (!id) id = (await getStatus(s)).wlanId;
	await api(s, `/rest/wlanconf/${id}`, {
		method: "PUT",
		body: JSON.stringify({ enabled })
	});
}
var TKEY = "tnk-resume-at";
var getResumeAt = () => Number(localStorage.getItem(TKEY) || 0) || null;
var setResumeAt = (t) => t ? localStorage.setItem(TKEY, String(t)) : localStorage.removeItem(TKEY);
function nextMorning(hour = 7, now = /* @__PURE__ */ new Date()) {
	const d = new Date(now);
	d.setHours(hour, 0, 0, 0);
	if (d <= now) d.setDate(d.getDate() + 1);
	return d.getTime();
}
function fmt(ms) {
	const m = Math.max(0, Math.round(ms / 6e4));
	return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
function Index() {
	const [settings, setSettings] = (0, import_react.useState)(DEFAULT_SETTINGS);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [resumeAt, setResume] = (0, import_react.useState)(null);
	const [now, setNow] = (0, import_react.useState)(Date.now());
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setSettings(loadSettings());
		setResume(getResumeAt());
	}, []);
	const refresh = (0, import_react.useCallback)(async (s = settings) => {
		try {
			setError(null);
			setStatus(await getStatus(s));
		} catch (e) {
			setError(e.message);
		}
	}, [settings]);
	(0, import_react.useEffect)(() => {
		refresh();
		const i = setInterval(() => refresh(), 15e3);
		return () => clearInterval(i);
	}, [refresh]);
	const apply = async (enabled, until = null) => {
		setBusy(true);
		setStatus((s) => s ? {
			...s,
			enabled
		} : s);
		try {
			await setEnabled(settings, enabled, status?.wlanId);
			setResumeAt(until);
			setResume(until);
			await refresh();
		} catch (e) {
			setError(e.message);
			await refresh();
		} finally {
			setBusy(false);
		}
	};
	(0, import_react.useEffect)(() => {
		const i = setInterval(() => {
			const t = Date.now();
			setNow(t);
			if (resumeAt && t >= resumeAt && !busy) apply(true, null);
		}, 1e3);
		return () => clearInterval(i);
	});
	const on = status?.enabled ?? false;
	const loading = !status && !error;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-12",
		style: { paddingTop: "env(safe-area-inset-top)" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between pt-6 pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
						children: settings.mode === "demo" ? "Demo mode" : "Live · UniFi"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-bold tracking-tight text-foreground",
						children: "Kids Wi-Fi"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Settings",
						onClick: () => setOpen(true),
						className: "rounded-full bg-card p-2.5 shadow-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-5 w-5 text-foreground" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-3xl bg-card p-6 shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${on ? "bg-success text-primary-foreground" : "bg-muted text-muted-foreground"}`,
								children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "h-7 w-7" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "h-7 w-7" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-lg font-semibold text-foreground",
									children: settings.ssid
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-sm font-medium ${on ? "text-success" : "text-muted-foreground"}`,
									children: loading ? "Checking…" : busy ? "Updating…" : on ? "Online" : resumeAt ? `Paused · back in ${fmt(resumeAt - now)}` : "Off"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							role: "switch",
							"aria-checked": on,
							disabled: busy || loading,
							onClick: () => apply(!on),
							className: `mt-6 flex h-20 w-full items-center rounded-full p-2 transition-colors duration-300 disabled:opacity-60 ${on ? "bg-success flex-row-reverse" : "bg-muted"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-16 w-16 shrink-0 rounded-full bg-card shadow-md" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `flex-1 text-center text-lg font-semibold ${on ? "text-primary-foreground" : "text-muted-foreground"}`,
								children: on ? "Wi-Fi on" : "Wi-Fi off"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-center text-xs text-muted-foreground",
							children: on ? "Tap to turn off" : "Tap to turn on"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-8 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
					children: "Quick pause"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid grid-cols-3 gap-3",
					children: [[{
						l: "30 min",
						ms: 18e5,
						i: Timer
					}, {
						l: "1 hour",
						ms: 36e5,
						i: Timer
					}].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: busy,
						onClick: () => apply(false, Date.now() + o.ms),
						className: "flex flex-col items-center gap-1 rounded-2xl bg-card py-4 shadow-sm active:scale-95 transition-transform",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(o.i, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium text-foreground",
							children: o.l
						})]
					}, o.l)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: busy,
						onClick: () => apply(false, nextMorning(7)),
						className: "flex flex-col items-center gap-1 rounded-2xl bg-card py-4 shadow-sm active:scale-95 transition-transform",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium text-foreground",
							children: "Bedtime"
						})]
					})]
				}),
				resumeAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => apply(true, null),
					className: "mt-3 w-full rounded-2xl bg-card py-3 text-sm font-semibold text-primary shadow-sm",
					children: "Cancel pause & turn on now"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 mb-2 flex items-center justify-between px-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Connected devices"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Refresh",
						onClick: () => refresh(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4 text-muted-foreground" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "overflow-hidden rounded-3xl bg-card shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 border-b border-border px-5 py-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 font-medium text-foreground",
									children: "Devices online"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-bold text-foreground",
									children: status?.clients.length ?? "–"
								})
							]
						}),
						status?.clients.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border px-5 py-3 last:border-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-foreground",
								children: c.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: c.ip
							})] }), c.signal != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: [c.signal, " dBm"]
							})]
						}, c.name)),
						status && !status.clients.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-5 py-4 text-sm text-muted-foreground",
							children: "No devices connected."
						})
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-center text-xs text-muted-foreground",
					children: "Pause timers resume while this app is open. Add to Home Screen via Share → “Add to Home Screen”."
				})
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSheet, {
			initial: settings,
			onClose: () => setOpen(false),
			onSave: (s) => {
				saveSettings(s);
				setSettings(s);
				setStatus(null);
				setOpen(false);
				refresh(s);
			}
		})]
	});
}
function SettingsSheet({ initial, onClose, onSave }) {
	const [s, set] = (0, import_react.useState)(initial);
	const field = "mt-1 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl",
			onClick: (e) => e.stopPropagation(),
			style: { paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold text-foreground",
						children: "Settings"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Close",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5 text-muted-foreground" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4 grid grid-cols-3 rounded-xl bg-muted p-1 text-sm",
					children: [
						"demo",
						"local",
						"cloud"
					].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => set({
							...s,
							mode: m
						}),
						className: `rounded-lg py-2 font-medium capitalize ${s.mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`,
						children: m === "local" ? "Controller" : m === "cloud" ? "Proxy URL" : "Demo"
					}, m))
				}),
				s.mode !== "demo" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted-foreground",
							children: [s.mode === "local" ? "Console address" : "Network API base URL", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: field,
								placeholder: s.mode === "local" ? "https://192.168.1.1" : "https://proxy.example.com",
								value: s.endpoint,
								onChange: (e) => set({
									...s,
									endpoint: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted-foreground",
							children: ["API key", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								className: field,
								value: s.apiKey,
								onChange: (e) => set({
									...s,
									apiKey: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted-foreground",
							children: ["Site", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: field,
								value: s.site,
								onChange: (e) => set({
									...s,
									site: e.target.value
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-3 block text-sm text-muted-foreground",
					children: ["Wi-Fi name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						value: s.ssid,
						onChange: (e) => set({
							...s,
							ssid: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-muted-foreground",
					children: "Saved only on this device. Create an API key in UniFi Network → Settings → Control Plane → Integrations."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onSave(s),
					className: "mt-5 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground",
					children: "Save"
				})
			]
		})
	});
}
//#endregion
export { Index as component };

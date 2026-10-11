// Turbo Ninja forwarder: relays the dashboard's requests to your UniFi controller.
// No dependencies. Supports two controller types:
//   UniFi OS console (API key):  UNIFI_URL=https://192.168.1.1 UNIFI_API_KEY=xxx node server.mjs
//   Legacy controller (login):   UNIFI_URL=https://192.168.1.10:8443 UNIFI_USER=admin UNIFI_PASS=secret node server.mjs
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 8787);
const UNIFI_URL = (process.env.UNIFI_URL || "").replace(/\/$/, "");
const UNIFI_API_KEY = process.env.UNIFI_API_KEY || ""; // UniFi OS console API key
const UNIFI_USER = process.env.UNIFI_USER || ""; // legacy controller username
const UNIFI_PASS = process.env.UNIFI_PASS || ""; // legacy controller password
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || ""; // optional: require this in the app's API key field
const STATIC_DIR = process.env.STATIC_DIR || ""; // optional: serve the built dashboard too

if (!UNIFI_URL) {
  console.error("Set UNIFI_URL, e.g. https://192.168.1.1 or https://192.168.1.10:8443");
  process.exit(1);
}
if (!UNIFI_API_KEY && !(UNIFI_USER && UNIFI_PASS)) {
  console.error("Set UNIFI_API_KEY (UniFi OS) or UNIFI_USER + UNIFI_PASS (legacy controller)");
  process.exit(1);
}

const target = new URL(UNIFI_URL);
const agent = new https.Agent({ rejectUnauthorized: false }); // UniFi uses self-signed certs
// Legacy controllers serve the API at /api/... directly; UniFi OS consoles need /proxy/network.
const API_PREFIX = UNIFI_USER ? "" : "/proxy/network";

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,X-API-KEY");
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
}

// ---------- Legacy controller session (cookie + CSRF) ----------
let session = null; // { cookie, csrf }
function request(opts, body) {
  return new Promise((resolve, reject) => {
    const r = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        agent,
        ...opts,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ res, body: Buffer.concat(chunks) }));
      },
    );
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

async function login() {
  const { res, body } = await request(
    {
      path: "/api/login",
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    },
    JSON.stringify({ username: UNIFI_USER, password: UNIFI_PASS }),
  );
  if (res.statusCode !== 200) throw new Error(`UniFi login failed (${res.statusCode}): ${body.toString().slice(0, 200)}`);
  const cookies = (res.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");
  session = { cookie: cookies, csrf: res.headers["x-csrf-token"] || "" };
  console.log("Logged in to UniFi controller");
}

async function ensureSession() {
  if (!session) await login();
}

// ---------- Proxy one dashboard request to the controller ----------
async function proxy(req, res, retried) {
  const clientKey = req.headers["x-api-key"] || "";
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (UNIFI_USER) {
    await ensureSession();
    headers.Cookie = session.cookie;
    if (session.csrf) headers["X-CSRF-Token"] = session.csrf;
  } else {
    headers["X-API-KEY"] = UNIFI_API_KEY || clientKey;
  }

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    try {
      const { res: up, body } = await request(
        { path: `${API_PREFIX}${req.url}`, method: req.method, headers },
        chunks.length ? Buffer.concat(chunks) : undefined,
      );
      // Legacy session expired? Log in again and retry once.
      if (up.statusCode === 401 && UNIFI_USER && !retried) {
        session = null;
        return proxy(req, res, true);
      }
      res.writeHead(up.statusCode || 502, { "Content-Type": up.headers["content-type"] || "application/json" });
      res.end(body);
    } catch (e) {
      console.error("Upstream error:", e.message);
      if (!res.headersSent) res.writeHead(502);
      res.end(JSON.stringify({ error: "Cannot reach UniFi controller", detail: e.message }));
    }
  });
}

// ---------- Static dashboard (optional) ----------
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(STATIC_DIR, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(path.resolve(STATIC_DIR))) file = path.join(STATIC_DIR, "index.html");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(STATIC_DIR, "index.html");
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => {
    cors(req, res);
    if (req.method === "OPTIONS") return res.writeHead(204).end();
    if (req.url === "/health") return res.writeHead(200).end("ok");

    if (!req.url.startsWith("/api/")) {
      if (STATIC_DIR) return serveStatic(req, res);
      return res.writeHead(404).end("Not found");
    }

    if (ACCESS_TOKEN && (req.headers["x-api-key"] || "") !== ACCESS_TOKEN) return res.writeHead(401).end("Unauthorized");
    proxy(req, res, false).catch((e) => {
      console.error("Proxy error:", e.message);
      if (!res.headersSent) res.writeHead(502);
      res.end(JSON.stringify({ error: e.message }));
    });
  })
  .listen(PORT, () => console.log(`Forwarder on :${PORT} -> ${UNIFI_URL} (${UNIFI_USER ? "legacy login" : "API key"})`));

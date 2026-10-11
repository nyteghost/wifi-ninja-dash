// Turbo Ninja forwarder: relays the dashboard's requests to your UniFi console.
// No dependencies. Run: UNIFI_URL=https://192.168.1.1 UNIFI_API_KEY=xxx node server.mjs
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 8787);
const UNIFI_URL = (process.env.UNIFI_URL || "").replace(/\/$/, "");
const UNIFI_API_KEY = process.env.UNIFI_API_KEY || ""; // optional: if set, the browser never needs the key
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || ""; // optional: require this in the API key field
const STATIC_DIR = process.env.STATIC_DIR || ""; // optional: serve the built dashboard too

if (!UNIFI_URL) {
  console.error("Set UNIFI_URL, e.g. https://192.168.1.1");
  process.exit(1);
}

const target = new URL(UNIFI_URL);
const agent = new https.Agent({ rejectUnauthorized: false }); // UniFi consoles use self-signed certs

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

    const clientKey = req.headers["x-api-key"] || "";
    if (ACCESS_TOKEN && clientKey !== ACCESS_TOKEN) return res.writeHead(401).end("Unauthorized");
    const key = UNIFI_API_KEY || clientKey;

    const upstream = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `/proxy/network${req.url}`,
        method: req.method,
        agent,
        headers: { "X-API-KEY": key, Accept: "application/json", "Content-Type": "application/json" },
      },
      (up) => {
        res.writeHead(up.statusCode || 502, { "Content-Type": up.headers["content-type"] || "application/json" });
        up.pipe(res);
      },
    );
    upstream.on("error", (e) => {
      console.error("Upstream error:", e.message);
      if (!res.headersSent) res.writeHead(502);
      res.end(JSON.stringify({ error: "Cannot reach UniFi console", detail: e.message }));
    });
    req.pipe(upstream);
  })
  .listen(PORT, () => console.log(`Forwarder on :${PORT} -> ${UNIFI_URL}`));

# Turbo Ninja forwarder

A tiny relay that runs on your home network and passes the dashboard's requests to your UniFi console.

## Run it

Docker (recommended): edit `docker-compose.yml`, then `docker compose up -d`.

Plain Node 18+: `UNIFI_URL=https://192.168.1.10:8443 UNIFI_USER=... UNIFI_PASS=... ACCESS_TOKEN=... node server.mjs`

Check it: open `http://<machine-ip>:8787/health` — it should say `ok`.

## Settings

| Variable | Purpose |
| --- | --- |
| `UNIFI_URL` | Controller address (required). Legacy container: `https://<unraid-ip>:8443` |
| `UNIFI_USER` / `UNIFI_PASS` | Legacy controller login (local admin from UniFi → Admins & Users) |
| `UNIFI_API_KEY` | UniFi OS console API key (use instead of user/pass on newer consoles) |
| `ACCESS_TOKEN` | Password the app must send (enter it in the app's API key field) |
| `ALLOWED_ORIGINS` | Sites allowed to call it, comma-separated |
| `STATIC_DIR` | Folder of the built dashboard, to serve the app from the forwarder too |
| `PORT` | Default 8787 |

## Connecting the app

In the app: gear → Proxy URL → enter the forwarder address; put `ACCESS_TOKEN` in the API key field.

Browsers block an `https://` page (GitHub Pages) from calling a plain `http://` address. Pick one:

1. **HTTPS tunnel (works away from home too):** put the forwarder behind Tailscale Funnel or a Cloudflare Tunnel, and use that `https://` address as the Proxy URL. Keep `ACCESS_TOKEN` set.
2. **Home-only:** set `STATIC_DIR` to the built site and open `http://<machine-ip>:8787` instead of GitHub Pages.

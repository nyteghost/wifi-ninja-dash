// @lovable.dev/vite-tanstack-config already includes the core plugins — do NOT add them manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isPages = process.env["GITHUB_PAGES"] === "true";
const base = process.env["BASE_PATH"] || "/";

export default defineConfig({
  tanstackStart: isPages
    ? ({ server: { entry: "server" }, spa: { enabled: true } } as never)
    : { server: { entry: "server" } },
  vite: { base },
});

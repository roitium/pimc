import { execFileSync } from "node:child_process";
import { cp, rm } from "node:fs/promises";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "");
const base = (env.BASE_PATH || process.env.BASE_PATH || "/").replace(/\/$/, "");
const site = `dist/client${base}`;
const bundle = `${site}/pagefind`;

// Discard bundles copied from public by Astro, including obsolete index chunks.
await rm(bundle, { recursive: true, force: true });
execFileSync("pagefind", ["--site", site, "--output-path", bundle], {
  stdio: "inherit",
});
await rm("public/pagefind", { recursive: true, force: true });
await cp(bundle, "public/pagefind", { recursive: true });

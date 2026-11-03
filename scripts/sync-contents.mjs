import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { syncContents } from "@pimc/content/sync";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const name of [".env.local", ".env"])
  if (existsSync(new URL(name, new URL("../", import.meta.url))))
    loadEnvFile(new URL(name, new URL("../", import.meta.url)));
try {
  await syncContents({ root });
  console.log("Vault 已同步到根目录 contents/。");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

/**
 * 把 cf/_headers 复制到构建产物 dist/_headers，供 Cloudflare 读取。
 * 不能直接放在 public/_headers：Astro 7 会把它当作 JS 模块解析而报错。
 */
import { copyFileSync } from "node:fs";

copyFileSync(new URL("../cf/_headers", import.meta.url), "dist/_headers");
// eslint-disable-next-line no-console
console.log("[cf] copied _headers to dist/");

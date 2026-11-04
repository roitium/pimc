import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { email } from "../data/identity.js";

const hash = createHash("sha256")
  .update(email.trim().toLowerCase())
  .digest("hex");
const url = `https://gravatar.com/avatar/${hash}?s=640&d=404`;
const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) {
  throw new Error(`Failed to fetch Gravatar: HTTP ${response.status}`);
}
const source = Buffer.from(await response.arrayBuffer());
const image = sharp(source).rotate();
const assets = [
  ["images/logo.png", 640],
  ["favicons/favicon-16x16.png", 16],
  ["favicons/favicon-32x32.png", 32],
  ["favicons/android-chrome-96x96.png", 96],
  ["favicons/apple-touch-icon.png", 76],
  ["favicons/mstile-150x150.png", 150],
];
// Decode and generate every variant before replacing any existing asset.
const files = await Promise.all(
  assets.map(async ([name, size]) => [
    name,
    await image.clone().resize(size, size, { fit: "cover" }).png().toBuffer(),
  ]),
);
// ICO containers support PNG entries; retain /favicon.ico compatibility.
const icon = files.find(([name]) => name === "favicons/favicon-32x32.png")[1];
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(icon.length, 14);
header.writeUInt32LE(header.length, 18);
files.push(["favicons/favicon.ico", Buffer.concat([header, icon])]);
const root = new URL("../public/static/", import.meta.url);
await mkdir(new URL("images/", root), { recursive: true });
await mkdir(new URL("favicons/", root), { recursive: true });
await Promise.all(
  files.map(([name, data]) => writeFile(new URL(name, root), data)),
);
console.log("Gravatar synced to local avatar and favicon assets.");

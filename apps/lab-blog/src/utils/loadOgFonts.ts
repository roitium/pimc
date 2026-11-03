import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** 正文与 OG 图统一使用霞鹜文楷，Monaspace 只留给代码。 */
export const ogFontFamily = "LXGW WenKai";

// satori only understands TTF / OTF / WOFF, and fontsource ships the whole
// CJK font as a single WOFF (the "latin" subset label is misleading).
const WENKAI_VERSION = "5.3.0";
const WENKAI_FONTS = {
  regular: {
    url: `https://cdn.jsdelivr.net/fontsource/fonts/lxgw-wenkai@${WENKAI_VERSION}/latin-500-normal.woff`,
    cacheName: "lxgw-wenkai-500.woff",
  },
  bold: {
    url: `https://cdn.jsdelivr.net/fontsource/fonts/lxgw-wenkai@${WENKAI_VERSION}/latin-700-normal.woff`,
    cacheName: "lxgw-wenkai-700.woff",
  },
};

const cacheDir = join(process.cwd(), "node_modules", ".cache", "og-fonts");

async function readCachedOrDownload(url: string, cacheName: string) {
  const cachePath = join(cacheDir, cacheName);

  try {
    return await readFile(cachePath);
  } catch {
    // Not cached yet, download below.
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download OG font ${url}: ${response.status}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  try {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cachePath, data);
  } catch {
    // A read-only cache directory is fine, just skip caching.
  }
  return data;
}

// Both OG routes share the same process: download the large CJK fonts once.
let wenkaiPromise: Promise<[Buffer, Buffer]> | undefined;
function loadWenkaiFonts() {
  wenkaiPromise ??= Promise.all([
    readCachedOrDownload(
      WENKAI_FONTS.regular.url,
      WENKAI_FONTS.regular.cacheName,
    ),
    readCachedOrDownload(WENKAI_FONTS.bold.url, WENKAI_FONTS.bold.cacheName),
  ]);
  return wenkaiPromise;
}

type OgFont = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: "normal";
};

export async function loadOgFonts(): Promise<OgFont[]> {
  const [regular, bold] = await loadWenkaiFonts();

  return [
    // fontsource labels WenKai's Regular as 500; use it as the 400 face here.
    { name: "LXGW WenKai", data: regular, weight: 400, style: "normal" },
    { name: "LXGW WenKai", data: bold, weight: 700, style: "normal" },
  ];
}

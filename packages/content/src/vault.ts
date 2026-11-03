import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function workspaceRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    const manifest = join(current, "package.json");
    if (
      existsSync(manifest) &&
      JSON.parse(readFileSync(manifest, "utf8")).name === "pimc"
    )
      return current;
    const parent = dirname(current);
    if (parent === current) throw new Error("找不到 pimc workspace 根目录。");
    current = parent;
  }
}

export function contentsUrl(path = ""): URL {
  return pathToFileURL(join(workspaceRoot(), "contents", path) + "/");
}

export const articlePatterns = [
  "personal-blog/posts/**/*.{md,mdx}",
  "lab-blog/posts/**/*.{md,mdx}",
];

/** Collection IDs keep their origin; public URLs omit the vault's organization. */
export function articleSourcePath(path: string): string {
  return path
    .replaceAll("\\", "/")
    .replace(/^.*?(?:^|\/)contents\//, "")
    .replace(/^(?:personal-blog|lab-blog)\/posts\//, "");
}

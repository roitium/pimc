import { articleSourcePath } from "@pimc/content/vault";
import { normalizeArticleSlug } from "@pimc/content/paths";
import { slugifyStr } from "./slugify";

export const BLOG_PATH = "../../contents";

export function getPostSlugPath(
  id: string,
  filePath: string | undefined,
): string {
  const directories = articleSourcePath(filePath ?? "")
    .split("/")
    .slice(0, -1)
    .filter((part) => part && !part.startsWith("_"))
    .map(slugifyStr);
  const leaf = id.split("/").at(-1) ?? id;
  // A custom slug replaces the article directory name for an index entry.
  if (/\/index\.(md|mdx)$/.test(filePath ?? "") && leaf !== "index")
    directories.pop();
  return normalizeArticleSlug([...directories, leaf].join("/"));
}

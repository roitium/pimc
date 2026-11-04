import { getCollection } from "astro:content";
import readingTime from "reading-time";
import { articleSourcePath } from "@pimc/content/vault";
import { normalizeArticleSlug } from "@pimc/content/paths";

// Keep framework data on the server. Client islands import these types only.
export const allPosts = (
  await getCollection("posts", ({ data }) =>
    data.publish_to.includes("personal"),
  )
).map((entry) => ({
  ...entry.data,
  private: Boolean(entry.data.password),
  slug: normalizeArticleSlug(articleSourcePath(entry.id)),
  path: `blog/${normalizeArticleSlug(articleSourcePath(entry.id))}`,
  content: entry.body || "",
  _id: entry.id,
  _meta: {
    filePath:
      entry.filePath?.replace(/^.*?contents\//, "") ?? `${entry.id}.mdx`,
    directory: `blog/${normalizeArticleSlug(articleSourcePath(entry.id))}`
      .split("/")
      .slice(0, -1)
      .join("/"),
  },
  readingTime: readingTime(entry.body || "").minutes,
}));
export type Post = (typeof allPosts)[number];
export const allAuthors = (await getCollection("authors")).map((entry) => ({
  ...entry.data,
  slug: entry.id,
}));
export type Author = (typeof allAuthors)[number];

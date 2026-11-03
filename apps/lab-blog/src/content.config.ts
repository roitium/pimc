import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { slug } from "github-slugger";
import { articlePatterns, contentsUrl } from "@pimc/content/vault";
import { createArticleLoader } from "@pimc/content/loader";
import {
  z,
  postFields,
  postSchema,
  validatePublication,
} from "@pimc/content/schema";
import { BLOG_PATH, getPostSlugPath } from "./utils/postSlug";

export { BLOG_PATH } from "./utils/postSlug";

const posts = defineCollection({
  loader: createArticleLoader({
    base: contentsUrl(),
    pattern: articlePatterns,
    target: "lab",
    generateId: ({ entry, data }) =>
      String(
        data.slug ||
          entry
            .replace(/\.(md|mdx)$/, "")
            .split("/")
            .map((segment) => slug(segment))
            .join("/"),
      ),
    getPath: (id, { entry }) =>
      `/posts/${getPostSlugPath(id, `${BLOG_PATH}/${entry}`)}`,
  }),
  schema: ({ image }) =>
    postSchema.safeExtend({
      ogImage: image().or(z.string()).optional(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

const pages = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: contentsUrl("lab-blog/pages"),
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ""),
  }),
  schema: z
    .looseObject({
      ...postFields,
      date: postFields.date.nullable(),
      ogImage: z.string().optional(),
      canonicalURL: z.string().optional(),
    })
    .superRefine(validatePublication),
});

export const collections = { posts, pages };

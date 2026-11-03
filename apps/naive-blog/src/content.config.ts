import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { createArticleLoader } from "@pimc/content/loader";
import {
  articlePatterns,
  articleSourcePath,
  contentsUrl,
} from "@pimc/content/vault";
import { normalizeArticleSlug } from "@pimc/content/paths";
import { z, postSchema } from "@pimc/content/schema";

const posts = defineCollection({
  loader: createArticleLoader({
    base: contentsUrl(),
    pattern: articlePatterns,
    target: "personal",
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
    getPath: (id) => `/blog/${normalizeArticleSlug(articleSourcePath(id))}`,
  }),
  schema: postSchema.safeExtend({
    images: z.array(z.string()).optional(),
    layout: z.string().optional(),
    canonicalUrl: z.string().optional(),
  }),
});
const authors = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: contentsUrl("personal-blog/authors"),
    generateId: ({ entry }) => entry.replace(/\/index\.mdx$/, ""),
  }),
  schema: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    layout: z.string().optional(),
  }),
});
export const collections = { posts, authors };

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { createArticleLoader } from "@pimc/content/loader";
import {
  articlePatterns,
  articleSourcePath,
  contentsUrl,
} from "@pimc/content/vault";
import { normalizeArticleSlug } from "@pimc/content/paths";
import { z, postSchema, postFields } from "@pimc/content/schema";

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
const pages = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: contentsUrl("personal-blog/pages"),
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ""),
  }),
  schema: z.object({
    id: z.uuid(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().default(""),
    publish_to: postFields.publish_to,
    draft: postFields.draft,
    name: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    layout: z.string().optional(),
  }),
});
const projects = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: contentsUrl("personal-blog/projects"),
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ""),
  }),
  schema: ({ image }) =>
    z.object({
      id: z.uuid(),
      title: z.string(),
      description: z.string(),
      href: z.url().optional(),
      image: image().optional(),
      order: z.number().default(0),
      publish_to: postFields.publish_to,
      draft: postFields.draft,
    }),
});
export const collections = { posts, pages, projects };

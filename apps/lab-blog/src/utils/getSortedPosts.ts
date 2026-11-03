import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";

/**
 * Returns posts that are eligible to be shown to users, sorted by “last updated”
 * descending (uses `updated_at` when present, otherwise `date`).
 *
 * Note: filtering respects drafts and scheduled posts via `postFilter()`.
 */
export function getSortedPosts(posts: CollectionEntry<"posts">[]) {
  return posts
    .filter(postFilter)
    .sort(
      (a, b) =>
        Math.floor(
          new Date(b.data.updated_at ?? b.data.date).getTime() / 1000,
        ) -
        Math.floor(new Date(a.data.updated_at ?? a.data.date).getTime() / 1000),
    );
}

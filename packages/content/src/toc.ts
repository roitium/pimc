import type {} from "@astrojs/markdown-remark";
import type {} from "fumadocs-core/mdx-plugins/rehype-toc";
import { toString } from "hast-util-to-string";
import type { Root } from "hast";
import type { Plugin } from "unified";

/** Serializable Fumadocs items passed from Astro to React islands. */
export type TocItem = {
  title: string;
  url: string;
  depth: number;
};

export type Toc = TocItem[];

/** Extract before heading links/KaTeX add decorative or duplicated text. */
export const rehypeArticleToc: Plugin<[], Root> = function () {
  return (_tree, file) => {
    const toc: Toc = (file.data.rehypeToc ?? []).map((item) => ({
      title: toString(item.title),
      url: item.url,
      depth: item.depth,
    }));
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.articleToc = toc;
  };
};

import {
  unified,
  type UnifiedProcessorOptions,
} from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./file-name";

export type MarkdownProfile = "lab" | "personal";

/** Shared callouts, heading links, math and highlighting; Lab also renders a TOC. */
export function createMarkdownConfig(profile: MarkdownProfile) {
  const remarkPlugins: NonNullable<UnifiedProcessorOptions["remarkPlugins"]> = [
    remarkMath,
  ];
  const rehypePlugins: NonNullable<UnifiedProcessorOptions["rehypePlugins"]> = [
    rehypeCallouts,
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: "wrap",
        headingProperties: { className: ["content-header"] },
        properties: {
          className: ["heading-anchor"],
        },
        content: {
          type: "element",
          tagName: "span",
          properties: {
            className: ["content-header-link-icon"],
            ariaHidden: true,
          },
          children: [{ type: "text", value: "#" }],
        },
      },
    ],
    rehypeKatex,
  ];
  if (profile === "lab") {
    remarkPlugins.push(
      [remarkToc, { heading: "table of contents|目录" }],
      [
        remarkCollapse,
        { test: /^(Table of contents|目录)$/, summary: "展开目录" },
      ],
    );
  }
  return {
    processor: unified({
      remarkPlugins,
      rehypePlugins,
      ...(profile === "personal" ? { smartypants: false } : {}),
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" } as const,
      defaultColor: false as const,
      wrap: false,
      transformers: [
        transformerFileName({ profile }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  };
}

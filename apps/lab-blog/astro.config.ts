import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

import svelte from "@astrojs/svelte";

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
    svelte(),
  ],
  i18n: {
    locales: ["zh-CN"],
    defaultLocale: "zh-CN",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkMath,
        [remarkToc, { heading: "table of contents|目录" }],
        [
          remarkCollapse,
          { test: /^(Table of contents|目录)$/, summary: "展开目录" },
        ],
      ],
      rehypePlugins: [rehypeCallouts, rehypeKatex],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Monaspace Neon",
      cssVariable: "--font-monaspace-neon",
      provider: fontProviders.fontsource(),
      // 不使用自带 fallback：中文由 LXGW WenKai 接管，字体栈在 theme.css 中定义
      fallbacks: [],
      // Monaspace 只用于代码，正常体足够
      weights: [300, 400, 500, 600, 700],
      styles: ["normal"],
      // woff2 给浏览器，woff 给 satori（OG 图不接受 woff2）
      formats: ["woff2", "woff"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});

import { createMarkdownConfig } from "@pimc/content/markdown";
import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
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
    react(),
  ],
  i18n: {
    locales: ["zh-CN"],
    defaultLocale: "zh-CN",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: createMarkdownConfig("lab"),
  vite: {
    plugins: [tailwindcss()],
    resolve: { dedupe: ["react", "react-dom", "svelte"] },
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

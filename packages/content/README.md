# @pimc/content

两个博客共用的内容处理包，直接导出 TypeScript 源码，由 Astro / Vite 或 Bun 编译，不需要独立构建步骤。

| 入口                                | 用途                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `@pimc/content/schema`              | 统一 frontmatter、时间解析和发布约束；导出 `z`，供应用扩展 schema |
| `@pimc/content/loader`              | Astro glob 加载器、内容 ID / URL 冲突检测、开发模式文件删除处理   |
| `@pimc/content/vault`               | contents 路径及文章来源路径解析                                   |
| `@pimc/content/sync`                | Git / 本地 vault 镜像同步，失败保留旧内容                         |
| `@pimc/content/paths`               | 目录入口的 `/index` 规范化与冲突注册表                            |
| `@pimc/content/markdown`            | Astro Markdown processor、remark / rehype 配置和 Shiki 高亮       |
| `@pimc/content/toc`                 | Fumadocs 目录到 Astro frontmatter 的适配与可序列化目录类型        |
| `@pimc/content/components/toc`      | 两站共用的 React 目录与正文阅读进度 Hook                          |
| `@pimc/content/styles/toc.css`      | 目录基础样式，主题变量由应用提供                                  |
| `@pimc/content/render`              | RSS、Memos 等独立 Markdown → HTML 流水线                          |
| `@pimc/content/styles/callouts.css` | 两个博客共用的 Obsidian callout 样式                              |
| `@pimc/content/styles/headings.css` | 构建期标题锚点样式                                                |

## Astro 配置

```ts
import { createMarkdownConfig } from "@pimc/content/markdown";

export default defineConfig({
  markdown: createMarkdownConfig("lab"), // 或 personal
});
```

两套配置共用 `rehype-callouts`、`rehype-autolink-headings`、数学公式、代码主题、文件名标签和代码注解。标题锚点在构建时生成，支持键盘访问，不需要客户端追加链接；两站统一使用下述 Fumadocs 目录流水线，`lab` 额外保留旧文章的显式正文折叠目录。文件名标签使用各自的主题颜色。应用的 Tailwind 需扫描 `packages/content/src` 中的类名。

### 共享目录流水线

1. `remark-math` 解析数学语法后，`remarkHeading({ generateToc: false })` 写入标题 ID，支持 `[#custom-id]`，移除标题中的 ID 标记。默认 slug 使用 Fumadocs 内部的 `github-slugger`。
2. `rehypeToc({ exportToc: { as: "data" } })` 读取带 ID 的标题，处理 `[!toc]` / `[toc]`，把结果写入 `file.data.rehypeToc`。使用 data 模式以兼容 Markdown 和 MDX，不生成包含 JSX 的 ESM 导出。
3. `rehypeArticleToc` 将标题转成纯文本 `{ title, url, depth }[]`，写入 `file.data.astro.frontmatter.articleToc`。这发生在添加锚点 `#` 图标和 KaTeX 渲染之前，避免图标及公式的重复文本进入目录。
4. 页面通过 Astro `render(entry).remarkPluginFrontmatter.articleToc` 获取目录，传给 React island。不会重新解析文章原文，也不需要将 ReactNode 跨 island 序列化。

```astro
---
import { render } from "astro:content";
import type { Toc } from "@pimc/content/toc";

const { Content, remarkPluginFrontmatter } = await render(entry);
const toc: Toc = remarkPluginFrontmatter.articleToc;
---
```

`articleToc` 是编译器保留的派生字段，不要在文章 frontmatter 中手写。目录语法、显式 ID 的唯一性要求、组件锚点约定和交互行为见 [Naive Blog 文章目录说明](../../apps/naive-blog/README.md#文章目录与标题锚点)。这些扩展在 `personal` 和 `lab` 两个 profile 均启用。共享 React 组件通过 `headingOffset` 适配各站导航偏移，通过 `--toc-muted`、`--toc-line`、`--toc-active` 和 `--toc-max-height` 适配主题与可视高度；引入时需加载基础目录样式。`animatedIndicator` 可选开启连续高亮条的移动与伸缩动画，默认关闭，Lab Blog 已启用；该动画尊重 `prefers-reduced-motion`。

## Collection 配置

```ts
import { createArticleLoader } from "@pimc/content/loader";
import { normalizeArticleSlug } from "@pimc/content/paths";
import {
  articlePatterns,
  articleSourcePath,
  contentsUrl,
} from "@pimc/content/vault";
import { postSchema, z } from "@pimc/content/schema";

const posts = defineCollection({
  loader: createArticleLoader({
    base: contentsUrl(),
    pattern: articlePatterns,
    target: "personal",
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
    getPath: (id) => `/blog/${normalizeArticleSlug(articleSourcePath(id))}`,
  }),
  schema: postSchema.safeExtend({ images: z.array(z.string()).optional() }),
});
```

加载器在 schema 校验和模块注册前按目标站点筛选，并延迟编译正文，避免把其他站点的组件或未发布笔记纳入构建。

schema 保留自定义字段。`publish_to` 只允许 `lab`、`personal`，且不允许重复；指定 `lab` 时设置密码会报错。文章日期必须有效，字符串形式需要完整时间和时区。站点的发布筛选、草稿处理、页面组件和密码鉴权仍由应用负责。

`createHtmlProcessor()` 默认清理不安全 HTML。Memos 显式使用 `{ allowHtml: true, sanitize: false }`，沿用此前的 HTML 行为；此设置不用于 RSS 或文章正文。应用自己的 remark 扩展可通过 `remarkPlugins` 传入。

## 验证

在 monorepo 根目录运行 `bun run check`，执行本包的 TypeScript 检查以及两个应用的 Astro 检查。也可以单独运行 `bun run --filter @pimc/content check`。

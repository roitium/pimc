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
| `@pimc/content/toc`                 | 标题提取与重复标题锚点生成                                        |
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

两套配置共用 `rehype-callouts`、`rehype-slug`、`rehype-autolink-headings`、数学公式、代码主题、文件名标签和代码注解。标题锚点在构建时生成，支持键盘访问，不需要客户端追加链接；`lab` 额外保留折叠目录。文件名标签使用各自的主题颜色。应用的 Tailwind 需扫描 `packages/content/src` 中的类名。

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

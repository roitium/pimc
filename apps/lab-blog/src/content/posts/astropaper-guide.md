---
title: "AstroPaper 模板速查手册"
pubDatetime: 2026-10-20T20:10:00+08:00
featured: true
draft: false
tags:
  - Astro
  - 博客
  - 速查
description: "这个博客用到的 AstroPaper v6 特性、配置项、写作语法、路由和部署方式，全部整理在这里，方便随时查。"
---

这个博客基于 AstroPaper v6，静态构建后部署在 Cloudflare Workers 上。下面按「配置 → 写作 → 功能 → 部署 → 排错」整理，方便随时回来查。

## 目录

## 技术栈

| 部分      | 用了什么                                       |
| --------- | ---------------------------------------------- |
| 框架      | Astro 7（纯静态输出，无运行时）                |
| 样式      | Tailwind CSS 4 + `@tailwindcss/typography`     |
| 内容      | Markdown / MDX + Astro Content Collections     |
| 代码高亮  | Shiki（`min-light` / `night-owl` 双主题）      |
| 搜索      | Pagefind（构建时生成静态索引，无后端）         |
| OG 图片   | Satori + Sharp + Astro Fonts（构建时生成 PNG） |
| 类型/规范 | TypeScript、oxlint、oxfmt                      |
| 部署      | Cloudflare Workers 静态资源（Wrangler）        |
| 包管理    | Bun 1.4.0（固定在仓库根 `packageManager`）     |

## 常用命令

| 命令                 | 作用                                                         |
| -------------------- | ------------------------------------------------------------ |
| `bun run dev`        | 本地开发，http://localhost:4321                              |
| `bun run build`      | 类型检查 → 构建 → 生成 Pagefind 索引 → 注入 `dist/_headers`  |
| `bun run preview`    | 预览 `dist` 构建结果                                         |
| `bun run sync`       | 生成 Astro 类型（改了 content config 后跑一下）              |
| `bun run lint`       | oxlint                                                       |
| `bun run format`     | oxfmt 格式化（`format:check` 只检查）                        |
| `bun run deploy`     | `bun run build` + `wrangler deploy`，一条命令发到 Cloudflare |
| `bun run cf:preview` | `wrangler dev`，用 Workers 运行时本地预览静态资源            |

> [!NOTE] 说明
> `bun run build` 不是单纯的 `astro build`：它还包含 `astro check`、`pagefind` 索引生成和 `_headers` 复制。CI 和 Cloudflare 上都用这条命令。

## 目录结构

```text
.
├── astro-paper.config.ts      # 站点配置（标题、域名、功能开关、社交链接…）
├── astro.config.ts            # Astro 配置（i18n、Markdown 插件、Shiki、字体）
├── wrangler.jsonc             # Cloudflare Workers 静态资源配置
├── cf/_headers                # 响应头（构建时复制到 dist）
├── scripts/cf-headers.mjs     # 把 cf/_headers 注入 dist
├── public/                    # 原样发布的静态文件（favicon、默认 OG 图）
└── src/
    ├── assets/
    │   ├── icons/             # 图标（含 socials/*.svg）
    │   └── images/            # 文章图片（走 Astro 图片管线）
    ├── components/            # Header、Footer、Card、分页、面包屑…
    ├── content/
    │   ├── pages/about.md     # 「关于」页
    │   └── posts/             # 文章
    ├── i18n/
    │   ├── index.ts           # useTranslations / tplStr
    │   ├── types.ts           # UIStrings 接口
    │   └── lang/{en,zh-CN}.ts # 界面文案
    ├── layouts/               # Layout（全站）、PostLayout（文章 SEO）
    ├── pages/                 # 路由
    ├── styles/                # global / theme / typography
    ├── types/config.ts        # 配置类型定义
    └── utils/                 # 排序、过滤、slug、OG 路径等
```

## 站点配置

全部在 `astro-paper.config.ts` 里，类型定义在 `src/types/config.ts`。

### 站点信息 `site`

| 字段                 | 说明                                                     | 默认值           |
| -------------------- | -------------------------------------------------------- | ---------------- |
| `url`                | 正式域名，影响 canonical、sitemap、RSS、OG 图            | 必填             |
| `title`              | 博客名                                                   | 必填             |
| `description`        | SEO 描述、RSS 描述                                       | 必填             |
| `author`             | 默认作者名                                               | 必填             |
| `profile`            | 作者主页，用于结构化数据                                 | 可选             |
| `ogImage`            | 默认 OG 图，必须是 `public/` 下的**单个文件名**          | `default-og.jpg` |
| `lang`               | 站点语言，必须出现在 `astro.config.ts` 的 `i18n.locales` | `en`             |
| `timezone`           | IANA 时区，用于文章日期                                  | `UTC`            |
| `dir`                | 文本方向：`ltr` / `rtl` / `auto`                         | `ltr`            |
| `googleVerification` | Search Console 验证码                                    | 可选             |

### 首页 `home`

| 字段       | 说明         | 默认值             |
| ---------- | ------------ | ------------------ |
| `greeting` | 首页大标题   | `site.title`       |
| `intro`    | 首页简介段落 | `site.description` |

### 文章与分页 `posts`

| 字段                  | 说明                     | 默认值              |
| --------------------- | ------------------------ | ------------------- |
| `perPage`             | `/posts/` 每页文章数     | `4`                 |
| `perIndex`            | 首页「最新文章」显示条数 | `4`                 |
| `scheduledPostMargin` | 定时发布提前量（毫秒）   | `900000`（15 分钟） |

### 功能开关 `features`

| 字段               | 说明                                          | 默认值       |
| ------------------ | --------------------------------------------- | ------------ |
| `lightAndDarkMode` | 是否显示明暗切换                              | `true`       |
| `dynamicOgImage`   | 构建时为每篇文章生成 OG 图                    | `true`       |
| `showArchives`     | 是否启用 `/archives/` 与导航入口              | `true`       |
| `showBackButton`   | 文章页是否显示返回按钮                        | `true`       |
| `editPost`         | 「编辑此页」：`{ enabled: true, url: "..." }` | 关闭         |
| `search`           | `"pagefind"` 或 `false`                       | `"pagefind"` |

### 社交与分享 `socials` / `shareLinks`

`name` 必须对应 `src/assets/icons/socials/` 下的 SVG 文件名。现成可用的有：`github`、`x`、`linkedin`、`mail`、`facebook`、`pinterest`、`telegram`、`whatsapp`。

```ts
socials: [{ name: "github", url: "https://github.com/you" }],
shareLinks: [{ name: "x", url: "https://x.com/intent/post?url=" }],
```

`linkTitle` 可以覆盖 `aria-label`，不填会自动生成。

## 写文章

### 文件位置与 URL

文章放在 `src/content/posts/`，支持 `.md` 和 `.mdx`。

| 文件路径                             | URL                                 |
| ------------------------------------ | ----------------------------------- |
| `src/content/posts/hello.md`         | `/posts/hello/`                     |
| `src/content/posts/2026/hello.md`    | `/posts/2026/hello/`                |
| `src/content/posts/_drafts/hello.md` | `/posts/hello/`（`_` 目录不进 URL） |
| `src/content/posts/_hello.md`        | 不构建（文件名以 `_` 开头）         |

另外可以在 frontmatter 里用 `slug` 覆盖文件名带来的路径段，例如 `slug: hello-world`。改动 slug 或文件名会改变 URL，旧链接会 404，没有自动重定向。

### Frontmatter

只有 `title`、`description`、`pubDatetime` 是必填的。

| 字段           | 说明                                                     | 默认值          |
| -------------- | -------------------------------------------------------- | --------------- |
| `title`        | 文章标题（渲染成 h1）                                    | 必填            |
| `description`  | 摘要，用于列表和 SEO                                     | 必填            |
| `pubDatetime`  | 发布时间，ISO 8601                                       | 必填            |
| `modDatetime`  | 修改时间，填了会显示「更新于」并影响排序                 | 空              |
| `author`       | 作者                                                     | `site.author`   |
| `featured`     | 是否进首页「精选」                                       | `false`         |
| `draft`        | 草稿，永不构建                                           | `false`         |
| `tags`         | 标签数组                                                 | `["others"]`    |
| `ogImage`      | 自定义 OG 图，相对路径或远程 URL                         | 动态生成        |
| `canonicalURL` | 原文链接（文章同时发在别处时用）                         | 当前文章 URL    |
| `hideEditPost` | 这篇文章隐藏「编辑此页」                                 | `false`         |
| `timezone`     | 单篇覆盖站点时区                                         | `site.timezone` |
| `slug`         | 覆盖 URL 路径段（Astro glob loader 支持，未写进 schema） | 文件名          |

```yaml
---
title: "文章标题"
pubDatetime: 2026-10-20T20:00:00+08:00
description: "一句话摘要。"
tags:
  - 随笔
draft: false
---
```

### 草稿与定时发布

- `draft: true`：任何环境都不构建。
- `pubDatetime` 在未来：**生产构建不会生成页面**（包括 OG 图），本地 `dev` 下可见。
- 判断逻辑在 `src/utils/postFilter.ts`，提前量由 `posts.scheduledPostMargin` 控制。

> [!WARNING] 注意
> 写完文章发现页面 404，先检查 `pubDatetime` 是不是未来时间。改成过去时间即可，不需要等。

### 图片

| 写法                                  | 说明                               |
| ------------------------------------- | ---------------------------------- |
| `![alt](@/assets/images/foo.png)`     | 推荐，走 Astro 图片管线，自动优化  |
| `![alt](../../assets/images/foo.png)` | 相对路径，等价写法                 |
| `![alt](/foo.png)`                    | `public/` 下的文件，原样发布不优化 |

MDX 里可以 import 图片拿元数据，本项目的大小端示意图就是这么用的：

```mdx
import diagram from "@/assets/images/endianness.svg";

<img
  src={diagram.src}
  width={diagram.width}
  height={diagram.height}
  alt="示意图"
/>
```

### 目录（TOC）

在文章里写一个二级标题 `## 目录`（或 `## Table of contents`），`remark-toc` 会把后面的标题自动生成目录列表，`remark-collapse` 把它折叠成「展开目录」。

- 正文标题用 h2～h6，h1 留给 frontmatter 的 `title`。
- 目录是构建时生成的，增删小节不需要手动维护。

### 代码块

````md
```ts file="src/utils/foo.ts"
export const answer = 42;
```
````

- `file="..."` 会在代码块左上角显示文件名徽标（`transformerFileName`）。
- 行内标注（Shiki transformers）：

| 写法                     | 效果                   |
| ------------------------ | ---------------------- |
| `// [!code highlight]`   | 高亮这一行             |
| `// [!code highlight:3]` | 高亮连续 3 行          |
| `// [!code ++]`          | 绿色 diff 新增行       |
| `// [!code --]`          | 红色 diff 删除行       |
| `// [!code word:foo]`    | 高亮代码里出现的 `foo` |

代码主题是 `min-light` / `night-owl`，跟随明暗模式切换；`wrap: false`，超长代码横向滚动。

### Callouts（提示块）

基于 `rehype-callouts`，用引用块语法：

```md
> [!NOTE]
> 补充说明。

> [!WARNING]- 默认折叠的警告
> 点开才显示。

> [!TIP]+ 默认展开但可折叠
> 一开始是展开的。
```

支持的类型：`NOTE`、`ABSTRACT`、`INFO`、`TODO`、`TIP`、`SUCCESS`、`QUESTION`、`WARNING`、`FAILURE`、`DANGER`、`BUG`、`EXAMPLE`、`QUOTE`。

类型后面直接写文字可以自定义标题；加 `-` 默认折叠，加 `+` 默认展开。

### 表格

普通 Markdown 表格即可。内容较宽时，可以在 MDX 里套一层响应式容器：

```mdx
import ResponsiveTable from "@/components/ResponsiveTable.astro";

<ResponsiveTable variant="striped-minimal">
  | 列 1 | 列 2 | | ---- | ---- | | 内容 | 内容 |
</ResponsiveTable>
```

`variant` 可选 `minimal`（无边框）、`striped`（斑马纹）、`striped-minimal`（斑马纹 + 无边框）。

### 数学公式

Markdown 和 MDX 均支持 LaTeX 公式，由 KaTeX 在构建时渲染，无需客户端脚本。

行内公式用一对 `$` 包裹，例如 `$E = mc^2$`：$E = mc^2$。

独立公式用两行 `$$` 包裹：

```latex
$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
```

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$

长公式可横向滚动。普通文本中需要显示美元符号时，写成 `\$`。

## 页面与路由

| 路由                      | 来源                                    | 说明                       |
| ------------------------- | --------------------------------------- | -------------------------- |
| `/`                       | `src/pages/index.astro`                 | 首页：问候、精选、最新文章 |
| `/posts/`、`/posts/2/`    | `src/pages/posts/[...page].astro`       | 文章列表与分页             |
| `/posts/<slug>/`          | `src/pages/posts/[...slug]/index.astro` | 文章详情                   |
| `/posts/<slug>/index.png` | `.../index.png.ts`                      | 动态 OG 图（每篇一张）     |
| `/tags/`、`/tags/<tag>/`  | `src/pages/tags/`                       | 标签列表与标签文章页       |
| `/archives/`              | `src/pages/archives/index.astro`        | 按年份归档                 |
| `/search/`                | `src/pages/search.astro`                | Pagefind 搜索页            |
| `/about/`                 | `src/content/pages/about.md`            | 关于页                     |
| `/404`                    | `src/pages/404.astro`                   | 自定义 404                 |
| `/rss.xml`                | `src/pages/rss.xml.ts`                  | RSS                        |
| `/sitemap-index.xml`      | `@astrojs/sitemap`                      | 站点地图                   |
| `/robots.txt`             | `src/pages/robots.txt.ts`               | 带 sitemap 地址的 robots   |
| `/og.png`                 | `src/pages/og.png.ts`                   | 默认动态 OG 图             |

## 主题与样式

### 颜色

`src/styles/theme.css` 定义设计令牌，并通过 Tailwind 的 `@theme` 暴露成工具类：

| CSS 变量              | Tailwind 类                 | 用途           |
| --------------------- | --------------------------- | -------------- |
| `--background`        | `bg-background`             | 页面背景       |
| `--foreground`        | `text-foreground`           | 正文颜色       |
| `--accent`            | `bg-accent` / `text-accent` | 强调色         |
| `--accent-foreground` | `text-accent-foreground`    | 强调色上的文字 |
| `--muted`             | `bg-muted`                  | 弱化背景       |
| `--muted-foreground`  | `text-muted-foreground`     | 次要文字       |
| `--border`            | `border-border`             | 边框           |

改配色只需要改 `:root` 和 `[data-theme="dark"]` 两组值。

### 字体

站点字体在 `astro.config.ts` 的 `fonts` 数组里声明（Astro Fonts API，构建时下载并自托管），CSS 变量在 `src/styles/theme.css` 里组合：

- `LXGW WenKai`（霞鹜文楷）：正文（中英文）、标题。通过 `@chinese-fonts/lxgwwenkai` 引入，按 `unicode-range` 拆成 300 多个 woff2 分片，浏览器只下载页面实际用到的字形。标题和加粗额外使用 Medium（`LXGW WenKai Medium`），避免合成粗体。
- `Monaspace Neon`（`--font-monaspace-neon`）：只用于代码块和行内代码（`--font-mono`）。

```css
--font-app: "LXGW WenKai", monospace;
--font-mono: var(--font-monaspace-neon), ui-monospace, monospace;
```

OG 图由 satori 在构建时生成，统一使用文楷 WOFF（satori 不支持 woff2）。字体首次下载后会缓存在 `node_modules/.cache/og-fonts/`，相关逻辑在 `src/utils/loadOgFonts.ts`。

换字体：在 `fonts` 数组里改 `name` / `provider` / `weights`，再调整 `theme.css` 里的 `--font-app` / `--font-mono`。

### 明暗模式与过渡

- 切换按钮在 `Header.astro`，主题存在 `localStorage` 的 `theme` 键里，跟随系统偏好，首屏有内联脚本避免闪烁。
- 全站启用了 Astro 的 `ClientRouter`（View Transitions），页面切换有淡入效果。

### 排版

文章容器用 `.app-prose`（`@tailwindcss/typography` 的 `prose` 加主题覆盖），相关样式在 `src/styles/typography.css`。

## 多语言（i18n）

- 界面文案在 `src/i18n/lang/*.ts`，实现 `UIStrings` 接口；缺失的 key 会回退到 `en.ts`。
- 语言由 `site.lang` 和 `astro.config.ts` 的 `i18n.locales` 共同决定，**两者必须一致**，否则 `getRelativeLocaleUrl` 会抛 `MissingLocaleError`。
- 新增语言：加 `src/i18n/lang/xx.ts` → 把 `xx` 加进 `i18n.locales` → 改 `site.lang`。
- 日期格式在 `Datetime.astro` 里按语言前缀处理：`zh` 用 `YYYY年M月D日`，其余用 `D MMM, YYYY`。

## SEO 与订阅

- 每页都有 canonical、description、Open Graph / Twitter Card 元数据。
- 文章页输出 BlogPosting 结构化数据（标题、作者、发布时间、修改时间、图片）。
- 动态 OG：`satori` 渲染 SVG，`sharp` 转 PNG，字体通过 `astro:assets` 获取；文章没有自定义 `ogImage` 时自动生成。
- `sitemap` 由 `@astrojs/sitemap` 生成，`showArchives` 关闭时会自动过滤归档页。
- RSS 在 `/rss.xml`，`Layout.astro` 里有 `<link rel="alternate">` 自动发现。
- Google 站点验证：`site.googleVerification`，或构建时提供 `PUBLIC_GOOGLE_SITE_VERIFICATION` 环境变量。

## 搜索

- 用 Pagefind：构建时扫描 `dist`，只索引带 `data-pagefind-body` 的页面（文章正文）。
- 搜索页 `/search/` 用 `@pagefind/default-ui` 渲染，支持中文分词，无需任何后端。
- 索引产物在 `dist/pagefind/`，构建后还会复制一份到 `public/pagefind/`（已 gitignore）。
- `features.search: false` 会隐藏导航里的搜索入口，并把 `/search/` 重写为 404。

> [!TIP] 小提示
> `bun run dev` 下搜索依赖上一次构建生成的 `public/pagefind/`。新机器克隆后先跑一次 `bun run build`，本地搜索才有索引。

## 部署到 Cloudflare

纯静态站点，不需要任何 adapter。配置在 `wrangler.jsonc`：

```jsonc
{
  "name": "lab-blog",
  "compatibility_date": "2026-10-20",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
  },
}
```

### 方式一：连接 Git 自动部署（推荐）

1. Cloudflare Dashboard → Workers & Pages → Create application → Workers → Import a repository
2. 仓库根目录执行安装 `bun install --frozen-lockfile`，Build command：`bun run build:lab-blog`
3. Deploy command：`cd apps/lab-blog && bunx --no-install wrangler deploy`
4. 环境变量：`NODE_VERSION=24`（Astro 7 要求 Node ≥ 22.12）
5. 之后每次 push 到 `main` 自动构建，PR 会有预览部署

### 方式二：本地命令行

```bash
bunx --no-install wrangler login
bun run deploy
```

### 域名

Worker → Settings → Domains & Routes → Add custom domain。绑定后把 `astro-paper.config.ts` 的 `site.url` 改成新域名，再部署一次，否则 canonical / sitemap / RSS 还是旧地址。

### 响应头

`cf/_headers` 在构建时复制到 `dist/_headers`：`/_astro/*` 长缓存，其余加 `X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`。

> [!WARNING] 注意
> 不要直接把 `_headers` 放进 `public/`。Astro 7 会把 `public/_headers` 当成 JS 模块解析，构建直接报 `PARSE_ERROR`。

### 配额

Workers 免费版静态资源上限约 25 MiB，目前构建产物约 8～9 MB，文章图片多了要留意体积。

## 排错清单

| 现象                                  | 原因与处理                                                   |
| ------------------------------------- | ------------------------------------------------------------ |
| 文章 404                              | `pubDatetime` 是未来时间；改成过去时间，或等定时发布         |
| 构建报 `MissingLocaleError: zh-CN`    | `site.lang` 不在 `i18n.locales` 里，两边保持一致             |
| `_headers` 构建报 `PARSE_ERROR`       | 文件放在了 `public/`，改放 `cf/` 并靠脚本注入                |
| 搜索没有结果                          | 索引是构建产物，先跑 `bun run build`                         |
| 图片 404                              | `@/assets` 用于 `src/assets`；`public/` 下用 `/xxx` 直接引用 |
| 标签 URL 是一串 `%E5...`              | 中文标签会被 URL 编码，属正常现象                            |
| `bun install` 被拒绝                  | 检查根目录 `packageManager`，使用 Bun 1.4.0                  |
| Cloudflare 构建失败，提示 Node 版本低 | 构建环境变量加 `NODE_VERSION=24`                             |
| OG 图没更新                           | 构建时生成；改标题后需要重新构建部署                         |

## 快速索引

| 想改什么             | 去哪里                                                   |
| -------------------- | -------------------------------------------------------- |
| 站点名 / 域名 / 作者 | `astro-paper.config.ts` → `site`                         |
| 首页问候和简介       | `astro-paper.config.ts` → `home`                         |
| 功能开关 / 分享链接  | `astro-paper.config.ts` → `features` / `shareLinks`      |
| 导航项               | `src/components/Header.astro` + `src/i18n/lang/zh-CN.ts` |
| 关于页               | `src/content/pages/about.md`                             |
| 配色                 | `src/styles/theme.css`                                   |
| 字体                 | `astro.config.ts` → `fonts` + `theme.css`                |
| 中文界面文案         | `src/i18n/lang/zh-CN.ts`                                 |
| 日期格式             | `src/components/Datetime.astro`                          |
| 代码高亮主题         | `astro.config.ts` → `shikiConfig.themes`                 |
| 搜索开关             | `features.search`                                        |
| 部署配置             | `wrangler.jsonc`、`package.json` → `deploy`              |
| 响应头               | `cf/_headers`                                            |

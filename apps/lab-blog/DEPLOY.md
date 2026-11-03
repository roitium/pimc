# 部署到 Cloudflare

这个目录已经是 AstroPaper v6（Astro 7 + Tailwind 4）的可运行状态，并且已经配置好 Cloudflare Workers 静态资源部署。

- 本地构建：`bun run build` → 产物在 `dist/`
- 本地预览构建结果：`bun run preview`
- 本地模拟 Cloudflare 环境：`bun run cf:preview`（= `wrangler dev`）
- 一键构建 + 部署：`bun run deploy`（= `bun run build && wrangler deploy`）

## 版本固定

Bun 版本固定在仓库根目录 `package.json` 的 `packageManager` 字段，使用根目录唯一的 `bun.lock`。依赖安装在仓库根目录执行 `bun install --frozen-lockfile`，下文应用命令在 `apps/lab-blog` 执行。Node 推荐 24，仓库最低版本为 22.23.4。

## 0. 先改这几处占位信息

`astro-paper.config.ts`：

| 位置                | 说明                                                    |
| ------------------- | ------------------------------------------------------- |
| `site.url`          | 正式域名，带协议和结尾斜杠，如 `https://blog.foo.com/`  |
| `site.title`        | 博客名（当前 `Lab Blog`）                               |
| `site.description`  | 站点描述，用于 SEO / RSS                                |
| `site.author`       | 默认作者名                                              |
| `site.profile`      | 作者主页（结构化数据用）                                |
| `site.timezone`     | 时区，当前 `Asia/Shanghai`                              |
| `features.editPost` | “编辑此页”链接，改成你的仓库地址或 `{ enabled: false }` |
| `socials`           | 社交链接，图标名见 `src/assets/icons/socials/`          |

`wrangler.jsonc` 里的 `name: "lab-blog"` 是 Worker 名称，也会决定 `*.workers.dev` 子域名，可以按需改。

> `site.url` 一定要在第一次正式部署前填对，它会写进 canonical、sitemap、RSS 和 OG 图。

## 1. 本地跑起来

```bash
bun run dev        # http://localhost:4321
bun run build      # 构建 + Pagefind 搜索索引
bun run preview    # 预览 dist
```

## 2. 推到 GitHub

请将整个 pimc monorepo 推送到你的 GitHub 仓库。两个应用共享根目录的依赖安装与锁文件。

## 3. 部署到 Cloudflare（推荐：Workers + 静态资源）

Cloudflare 现在推荐新项目用 Workers，而不是 Pages；本项目是纯静态站点，不需要任何 adapter。

### 方式 A：连接 Git 自动部署（推荐）

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application**
2. 选 **Workers** → **Import a repository**（连接 GitHub，授权 monorepo 仓库）
3. 构建设置：
   - Install command：`bun install --frozen-lockfile`
   - Build command：`bun run build:lab-blog`
   - Deploy command：`cd apps/lab-blog && bunx --no-install wrangler deploy`
   - Root directory：`/`（默认）
4. 环境变量（Settings → Build → Variables）：
   - `NODE_VERSION` = `24`（Astro 7 要求 Node ≥ 22.12）
5. 保存并部署。之后每次 push 到 `main` 都会自动构建发布，PR 会有预览部署。

### 方式 B：本地命令行部署

```bash
bunx --no-install wrangler login   # 浏览器授权一次
bun run deploy          # 构建并上传
```

第一次部署后地址形如 `https://lab-blog.<你的-workers-子域>.workers.dev`。

### 方式 C：仍然想用 Cloudflare Pages

可以，纯静态站点 Pages 完全够用：连接 Git 后 Build command 填 `bun run build:lab-blog`、Build output directory 填 `apps/lab-blog/dist`，环境变量加 `NODE_VERSION=24` 即可。区别是 Pages 正在逐步并入 Workers，新项目官方更推荐 Workers。

## 4. 绑定自己的域名

Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain**，输入域名并按提示在 Cloudflare 托管 DNS 里加记录（域名需已托管在 Cloudflare，免费计划即可，自带 SSL）。

绑定后记得把 `astro-paper.config.ts` 的 `site.url` 改成这个域名，再 push 一次触发重新构建，否则 canonical / sitemap 仍然指向旧地址。

## 5. 写文章

在 `src/content/posts/` 下新建 `.md` 或 `.mdx`，frontmatter 必填 `title`、`pubDatetime`、`description`：

```md
---
title: "我的第一篇文章"
pubDatetime: 2026-10-20T10:00:00+08:00
description: "一句话摘要，会出现在列表和 SEO 描述里。"
tags: ["notes"]
draft: false
---

正文……
```

- 子目录会变成 URL 的一部分；以 `_` 开头的目录只用于整理、不影响 URL
- `draft: true` 的文章不会发布
- 文章里的图片放 `src/assets/images/`，用相对路径引用
- “关于”页在 `src/content/pages/about.md`

## 6. 上线前的清理

模板自带的示例文章已经删除，`src/content/posts/` 里只剩自己的文章。还需要把 `src/content/pages/about.md` 从模板默认文案改成自己的介绍。

写作规范和这套模板的完整功能，见站内文章《AstroPaper 模板速查手册》（`src/content/posts/astropaper-guide.md`）。

## 7. 可选增强

- **Google Search Console**：在 `astro-paper.config.ts` 的 `site.googleVerification` 填验证值
- **站点统计**：Cloudflare Web Analytics（免费、无 Cookie）在 Dashboard → Analytics 里开启
- **缓存 / 安全响应头**：`cf/_headers`，构建时由 `scripts/cf-headers.mjs` 复制到 `dist/_headers`
- **资源配额**：Workers 免费版静态资源上限约 25 MiB，当前构建产物约 8.4 MB，够用

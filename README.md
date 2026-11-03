# pimc

基于 Bun workspaces 的博客 monorepo。

| 应用                                     | 路径              | 开发地址              | 构建产物                                     |
| ---------------------------------------- | ----------------- | --------------------- | -------------------------------------------- |
| Lab Blog（Astro + Svelte）               | `apps/lab-blog`   | http://localhost:4321 | `apps/lab-blog/dist`                         |
| Naive Blog（Astro + React / Cloudflare） | `apps/naive-blog` | http://localhost:4322 | `apps/naive-blog/dist/client`、`dist/server` |

## 共享内容包

`packages/content`（`@pimc/content`）提供两个博客共用的 frontmatter schema、文章加载器与路径校验、remark / rehype 配置、Shiki 高亮、目录提取和 Markdown → HTML 流水线。应用保留页面、发布筛选和各自的组件渲染器。使用方式见 [包说明](packages/content/README.md)。

## 开发

使用 Bun 1.4.0 和 Node.js 24（最低 22.23.4）。Bun 负责安装和 workspace 调度，Astro / Wrangler 与现有 Node 脚本使用 Node.js。

```sh
bun install --frozen-lockfile
bun run dev                # 同时启动两个应用
bun run dev:lab-blog       # 只启动 Lab Blog
bun run dev:naive-blog     # 只启动 Naive Blog
bun run check
bun run lint
bun run format:check
bun run test:smoke         # Naive Blog 的 Worker 回归测试
bun run build              # 依次构建两个应用
bun run build:lab-blog
bun run build:naive-blog
```

各应用保留独立依赖与配置，使用 isolated linker 和根目录唯一的 `bun.lock`。新增依赖时进入对应应用执行 `bun add <package>`；不要创建应用级锁文件。根目录保留 Lab Blog 原有的 `@types/hast` override。所有应用统一通过 `bun run format` 格式化，唯一格式配置为根目录 `.oxfmtrc.json`，包括 Astro 和 Svelte 文件。oxlint 及其唯一配置 `.oxlintrc.json` 同样集中在根目录，应用脚本只是统一命令的入口。

## Vault 与 contents

文章、文章图片和交互组件统一保存在独立的 pimc-vault。两个博客直接读取根目录 `contents/`，不再把文章复制到应用目录。`contents/` 是 vault 的本地镜像，真实内容不会提交到 pimc 仓库，也不会整目录公开发布。

```text
contents/
├── personal-blog/
│   ├── posts/tech/gc/
│   │   ├── index.mdx
│   │   └── GCPlay.jsx
│   ├── authors/default/index.mdx
│   └── assets/
├── lab-blog/
│   ├── posts/endianness/
│   │   ├── index.mdx
│   │   ├── endianness.svg
│   │   └── EndiannessDemo.svelte
│   └── pages/about/index.md
└── obsidian-vault/
```

同步配置在根目录 `.env`（参考根目录 `.env.example`）：

- `VAULT_GIT_URL`：vault Git 仓库 URL；构建时浅克隆最新内容。
- `VAULT_GIT_TOKEN`：私库的只读 GitHub Token，仅用于构建。
- `VAULT_GIT_REF`：可选分支或 tag，默认仓库默认分支。
- `VAULT_PATH`：本地 vault 路径，例如 `/Users/你的用户名/Documents/pimc-vault`；未设置 Git URL 时使用。

运行 `bun run sync:contents` 可单独同步。`dev`、`check`、两个应用的 `build` 都会先同步；根目录 `build` 同步一次后依次构建两个博客。同步失败会中止，并保留上一份镜像；没有配置来源时不会静默构建空站点。不要并发执行同步、开发和构建，以免修改共享内容与 Astro 缓存。

两个博客会扫描两组文章目录，并在校验、编译前按 `publish_to` 筛选。因此文章放在哪组目录只影响组织，不限制发布站点；相同内容可以发布到两站。两站均支持 React 和 Svelte 文章组件，图片及组件使用 `./` 相对引用。其他笔记、草稿、模板和未发布文章不会自动变为网页。

Naive Blog 的站点变量仍放在 `apps/naive-blog/.env`；可用 `PUBLIC_VAULT_REPO_URL` 配置公开的文章编辑链接。不要把仓库凭据放进公开变量。

## 统一文章元数据

两个博客使用相同的基础 frontmatter；自定义字段会保留。`id` 是稳定 UUID，文章 URL 仍由原来的文件路径或 slug 决定。`date` 和可选的 `updated_at` 使用带时区的完整 ISO 8601 时间。

```yaml
---
id: "8edb34fc-6fb6-40df-8c8e-ff9332389864"
title: "文章标题"
publish_to: [lab, personal]
date: "2026-11-03T17:00:00+08:00"
updated_at: null
description: ""
tags: []
draft: false
pinned: false
password: null
---
```

`publish_to` 只允许 `lab`、`personal`，不允许重复；空数组表示不发布到任何博客。`pinned` 在 Lab 首页作为精选展示，在 Personal 列表置顶。非空 `password` 启用 Personal 密码保护；包含 `lab` 的文章设置非空密码会直接报错。作者使用站点配置，不再读取文章作者字段。

旧字段 `pubDatetime`、`modDatetime`、`summary`、`featured`、`private` 应分别迁移到 `date`、`updated_at`、`description`、`pinned`、`password`。`bun run check` 验证内容与类型，原有的 `bun run test:smoke` 验证 Personal 的发布筛选与密码保护。

两个博客统一支持文章目录入口：`tech/hello/index.md` 或 `index.mdx` 分别对应 `/posts/tech/hello/`（Lab）和 `/blog/tech/hello`（Personal）。图片和组件可以放在文章同目录，通过 `./` 相对引用。普通 `tech/hello.md` 的 URL 不变。入口文件必须位于具名文章目录，内容根目录的 `index.md` 不可占用列表页。

`hello.md` 与 `hello/index.md` 等产生相同 URL 的文章会在内容加载阶段报错，并指出两个源文件。内部内容标识保留完整源路径，公开 URL 只移除末尾的 `/index`，相对资源和 MDX 渲染仍使用真实源文件。自定义 `slug` 在 Lab 中覆盖文章名称；目录入口会替换文章目录对应的最后一段。

## 部署

从仓库根目录安装依赖：`bun install --frozen-lockfile`。在 Cloudflare 为两个应用分别建立项目，构建根目录均设为仓库根目录：

| 应用       | 构建命令                   | 部署命令                                                  |
| ---------- | -------------------------- | --------------------------------------------------------- |
| Lab Blog   | `bun run build:lab-blog`   | `cd apps/lab-blog && bunx --no-install wrangler deploy`   |
| Naive Blog | `bun run build:naive-blog` | `cd apps/naive-blog && bunx --no-install wrangler deploy` |

本地也可在应用目录执行 `bun run deploy`。CI 始终执行共享包类型检查、lint 和格式检查。配置仓库变量 `VAULT_GIT_URL`、可选 `VAULT_GIT_REF` 及 secret `VAULT_GIT_TOKEN` 后，还会执行两个应用的检查、原有 Worker smoke 和构建；不执行发布。smoke 会清理 Naive Blog 构建产物，因此应在最终构建之前运行。

Lab Blog 的 Docker 构建也从 vault 获取内容。设置 `VAULT_GIT_URL` 和可选的 `VAULT_GIT_TOKEN` 后，执行 `docker build --build-arg VAULT_GIT_URL --secret id=vault_git_token,env=VAULT_GIT_TOKEN -f apps/lab-blog/Dockerfile -t pimc-lab-blog .`。Token 使用 BuildKit secret，不进入镜像构建参数或最终镜像。Compose 同样从环境变量获取仓库地址与 secret，在 8080 端口提供静态站点。

## 导入来源

pimc 是后续开发和发布的主仓库，两个原仓库不再更新。源码最初从下列本地提交导入，原目录仅作为历史存档。仓库统一采用根目录 [MIT License](LICENSE)，保留 AstroPaper 的版权声明。仓库级 Git、编辑器和工具配置均集中在根目录，应用目录只保留构建、内容和部署所需文件。

- `lab-blog`：`2dec8b809f9cbfd21bd9879004e3569b7aac82d8`
- `NaiveBlog`：`57654303e796e79b7b89f8ca9616e9c15a01b185`

应用说明：[Lab Blog](apps/lab-blog/README.md)、[Lab Blog 部署](apps/lab-blog/DEPLOY.md)、[Naive Blog](apps/naive-blog/README.md)。

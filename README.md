# pimc

基于 Bun workspaces 的博客 monorepo。

| 应用                                     | 路径              | 开发地址              | 构建产物                                     |
| ---------------------------------------- | ----------------- | --------------------- | -------------------------------------------- |
| Lab Blog（Astro + Svelte）               | `apps/lab-blog`   | http://localhost:4321 | `apps/lab-blog/dist`                         |
| Naive Blog（Astro + React / Cloudflare） | `apps/naive-blog` | http://localhost:4322 | `apps/naive-blog/dist/client`、`dist/server` |

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

Naive Blog 的环境变量放在 `apps/naive-blog/.env`（参考 `.env.example`）。未配置 `GIT_URL` 时使用本地 `data/blog`，配置后构建前同步文章仓库。环境密钥与真实文章通过根目录 `.gitignore` 排除，生成内容和构建缓存不进入 Git。Lab Blog 的文章位于 `apps/lab-blog/src/content/posts`。同一应用的 dev、check、build、smoke 不要并发运行，以免修改共享缓存。

## 部署

从仓库根目录安装依赖：`bun install --frozen-lockfile`。在 Cloudflare 为两个应用分别建立项目，构建根目录均设为仓库根目录：

| 应用       | 构建命令                   | 部署命令                                                  |
| ---------- | -------------------------- | --------------------------------------------------------- |
| Lab Blog   | `bun run build:lab-blog`   | `cd apps/lab-blog && bunx --no-install wrangler deploy`   |
| Naive Blog | `bun run build:naive-blog` | `cd apps/naive-blog && bunx --no-install wrangler deploy` |

本地也可在应用目录执行 `bun run deploy`。CI 验证检查、lint、格式、Worker smoke 和两个应用的构建，不执行发布。smoke 会清理 Naive Blog 构建产物，因此应在最终构建之前运行。

Lab Blog 可使用 Docker：在仓库根目录执行 `docker build -f apps/lab-blog/Dockerfile -t pimc-lab-blog .`，或 `docker compose -f apps/lab-blog/compose.yaml up --build`，后者在 8080 端口提供静态站点。

## 导入来源

pimc 是后续开发和发布的主仓库，两个原仓库不再更新。源码最初从下列本地提交导入，原目录仅作为历史存档。仓库统一采用根目录 [MIT License](LICENSE)，保留 AstroPaper 的版权声明。仓库级 Git、编辑器和工具配置均集中在根目录，应用目录只保留构建、内容和部署所需文件。

- `lab-blog`：`2dec8b809f9cbfd21bd9879004e3569b7aac82d8`
- `NaiveBlog`：`57654303e796e79b7b89f8ca9616e9c15a01b185`

应用说明：[Lab Blog](apps/lab-blog/README.md)、[Lab Blog 部署](apps/lab-blog/DEPLOY.md)、[Naive Blog](apps/naive-blog/README.md)。

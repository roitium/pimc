# Lab Blog

基于 Astro、Svelte 和 Tailwind CSS 的静态博客，最初基于 [Sat Naing 的 AstroPaper](https://github.com/satnaing/astro-paper) 修改。后续开发在 pimc 主仓库进行。

在仓库根目录安装依赖并启动：

```sh
bun install --frozen-lockfile
bun run dev:lab-blog
```

先在根目录 `.env` 配置 `VAULT_GIT_URL` / `VAULT_GIT_TOKEN`，或本地 `VAULT_PATH`；构建和启动时会同步到 `contents/`。

开发地址为 http://localhost:4321。在本目录可执行 `bun run build`、`bun run preview`、`bun run check` 和 `bun run lint`。格式化统一执行 `bun run format`，配置和工具依赖由仓库根目录管理。

- 站点配置：`astro-paper.config.ts`
- 文章：根目录 `contents/{lab-blog,personal-blog}/posts/`，按 `publish_to: [lab]` 筛选；修改独立 vault 中的源文件
- 关于页：根目录 `contents/lab-blog/pages/about/index.md`
- 搜索：构建时生成 Pagefind 索引，开发前先构建一次
- 部署：[DEPLOY.md](DEPLOY.md)
- 模板功能：vault 中的 `lab-blog/posts/astropaper-guide/index.md`
- 许可证：仓库根目录 [MIT License](../../LICENSE)

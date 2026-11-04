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

## 文章目录与阅读进度

与 Naive Blog 共用 Fumadocs 编译期目录、React 目录组件和正文阅读进度计算。`.md`、`.mdx` 的标题及目录来自同一次编译，目录不会包含标题前的装饰性 `#`。目录标题为纯文本，正文仍保留强调、行内代码和公式的排版。

- 屏幕宽度达到 1280px 时，目录跟随在正文右侧，正文维持原有居中窄栏宽度；较窄屏幕使用右下角“目录”按钮打开抽屉。
- 目录按标题层级缩进，跟随当前可见标题，并自动将激活条目滚入目录可视区域。点击抽屉内条目后自动收起；也可下滑或点击遮罩关闭，没有底部关闭按钮。
- 配色使用本站 `--accent`、`--muted-foreground` 和背景变量，浅色主题为蓝色强调、深色主题为橙色强调，沿用虚线边框和文楷字体。
- 阅读百分比和页面顶部进度线只计算正文：正文经过视口顶部 16px 处时起算，正文末尾进入视口时达到 100%；标签、分享和上一篇/下一篇不计入。
- 原有显式的正文折叠目录仍保留；新增侧栏/抽屉不要求文章写“目录”标题。扩展目录标记作用于新的 Fumadocs 目录，不建议再与旧的正文自动目录混用。

两站均支持以下语法：

```md
## 安装与配置 [#installation]

## 补充说明 [!toc] [#extra-notes]

## 交互演示 [toc] [#interactive-demo]

<MyDemo />
```

`[#id]` 指定文章内唯一的稳定锚点；`[!toc]` 保留正文标题但不加入目录；`[toc]` 只生成目录项并移除正文标题，此时组件须自行提供对应 ID（例如 `id="interactive-demo"`）。标记写在标题末尾的普通文本中，显式 ID 放最后。动态组件内部的标题不会自动被提取。

完整语法、重复 ID 注意事项及组件入口说明见 [Naive Blog 目录说明](../naive-blog/README.md#文章目录与标题锚点)。

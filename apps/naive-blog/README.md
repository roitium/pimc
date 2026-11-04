# Naive Blog

> Too young, too simple, sometimes naïve!
> —— 🐸

基于 Astro、React、Tailwind CSS 和 MDX 的个人博客。页面与公开正文在构建时生成 HTML，导航、目录、Memos 和文章内演示按需加载 React，搜索使用 Pagefind。密码文章等动态接口使用 Cloudflare Workers，OG 图片在构建时生成。

## 本地开发

推荐 Node.js 24，最低版本为 22.23.4；使用根目录固定的 Bun 1.4.0。依赖在 monorepo 根目录安装，下方应用命令在 `apps/naive-blog` 执行。

```sh
cd ../..
bun install --frozen-lockfile
cd apps/naive-blog
cp .env.example .env
bun run dev
```

开发服务器默认运行于 `http://localhost:4322`。

搜索入口位于 `/search`，支持 ⌘/Ctrl+K 和 `?q=关键词`。与 lab-blog 一样使用 Pagefind 默认 UI，支持中文全文搜索、命中摘要和小节结果。`bun run build` 在静态 HTML 生成后索引公开文章的标题与正文，将搜索资源写入 `dist/client/<base>/pagefind/` 并复制到 `public/pagefind/` 供开发使用；首次开发或文章更新后，需要重新构建索引。草稿、密码文章、列表和导航不会进入索引。

```sh
bun run check     # Astro 与 TypeScript 检查
bun run lint      # JS / TS / React 检查
bun run build     # 同步文章并构建 Cloudflare Worker 与静态资源
bun run serve     # 用 Wrangler / workerd 预览构建产物
bun run test:smoke # 在 workerd 中运行临时文章、隐私隔离与接口回归测试
bun run deploy:check # 对已构建的 Worker 执行部署 dry-run
bun run deploy    # 构建并发布到 Cloudflare Workers
```

`test:smoke` 会清理测试文章与构建产物，测试后请重新运行 `bun run build` 再部署。

不要并发运行 `check`、`build` 或多个开发服务器，它们共享 Astro 内容缓存。

## 文章与配置

站点信息位于 `data/siteMetadata.js`，分类显示名称与简介位于 `data/category-mapping.ts`。

- 文章直接读取根目录 `contents/{personal-blog,lab-blog}/posts/`，按 `publish_to` 包含 `personal` 筛选；修改独立 vault 中的源文件，不要修改生成的镜像。
- 作者资料位于 `contents/personal-blog/authors/default/index.mdx`。
- 一篇文章组织为 `tech/hello/index.md` 或 `index.mdx`，同目录放图片和自定义组件，通过相对路径引用。URL 为 `/blog/tech/hello`；组织目录 `personal-blog/posts` 不进入 URL。
- 构建和开发启动时，从根目录环境变量配置的 vault 同步到 `contents/`。文章专属组件不再放在应用的 `src/components` 中。
- 目录层级决定分类，例如 `contents/personal-blog/posts/programming/typescript/index.mdx` 对应 `/blog/programming/typescript` 与 `/categories/blog/programming`。
- 支持数学公式、Shiki 代码高亮、GitHub 提示块与 MDX 自定义组件。
- `draft: true` 的文章仅在开发环境显示。只有 `publish_to` 包含 `personal` 的文章会进入本站。设置非空 `password` 的文章会显示在首页、文章列表、分类、标签和前后篇导航中，但不进入搜索、RSS 和文章 sitemap；访问正文需要输入密码。
- 密码正文仅在服务端验证成功后返回。不要将受保护正文或密码放进公开图片、前端组件 props 或公开变量。
- 加密文章通过 Worker 按需渲染，解锁后使用与公开文章相同的 Astro 原生 MDX 流程，支持相对图片和 Astro / React 组件。普通文章仍在构建时生成静态 HTML，文章 URL 不变。
- 解锁状态使用按文章签名的 HttpOnly、SameSite=Lax Cookie，HTTPS 下启用 Secure，最长有效 7 天；密码变更后失效。页面和鉴权接口均返回 `private, no-store`，不会把正文放入共享缓存。
- 可在构建密钥中配置 `PRIVATE_POST_COOKIE_SECRET`（至少 32 字节随机字符串）以跨部署保留解锁状态。不设置也可运行，但每次构建会生成新密钥，部署后需要重新输入文章密码。图片仍作为公开静态资源发布，不属于正文鉴权范围。

已有的 `<Image />`、`<TOCInline />` 和 `<GCPlay />` 由组件映射兼容。新增 React 交互组件时，在 MDX 中导入组件并使用 Astro 的 `client:load` 或 `client:visible` 指令，或建立 `.astro` 包装组件。公开 MDX 不再使用 `@content-collections/mdx/react` 编译产物。

### 文章目录与标题锚点

本站的 `.md` 和 `.mdx` 文章在编译时使用 Fumadocs `remarkHeading` 生成标题 ID，使用 `rehypeToc` 提取目录。标题和目录来自同一次编译，不再单独解析原文，也不依赖客户端扫描正文。以下语法在 Naive Blog 和 Lab Blog 均可使用；两站共用目录组件，分别适配各自的主题和布局。

普通 `#` 到 `######` 标题自动进入目录，按层级缩进。自动 ID 使用 `github-slugger` 规则；重复标题依次追加 `-1`、`-2`。可用显式 ID 保持链接稳定，即使之后修改标题文字也不会影响旧链接：

```md
## 安装与配置 [#installation]
```

上例的正文标题显示“安装与配置”，目录链接为 `#installation`。`[#installation]` 不会显示在正文或目录。显式 ID 必须在文章内唯一，并避免与其他标题自动生成的 ID、组件 ID 冲突；插件不会替你修复重复的显式 ID。

支持两种目录控制标记，放在标题末尾；同时指定 ID 时，`[#id]` 放在最后：

```md
## 补充说明 [!toc] [#extra-notes]

这个标题保留在正文，但不出现在目录。

## 交互演示 [toc] [#interactive-demo]

<MyDemo />
```

- `[!toc]`：正文显示标题，目录跳过该标题；不会自动隐藏它下面的子标题。
- `[toc]`：只生成目录项，移除这个正文标题。它不会自动给 `<MyDemo />` 添加 ID；组件须自行渲染一个 `id="interactive-demo"` 的元素，才能正确跳转和跟随高亮。一般文章直接使用普通标题即可。
- 控制标记应写在最后的普通文本中，不要放进代码、强调或 JSX 标签内。建议搭配显式 ID，避免标记影响自动生成的 slug。

目录标题采用可序列化的纯文本：正文中的强调、行内代码、公式仍正常渲染，目录不保留这些样式。MDX 组件运行后动态生成的标题、JSX 表达式的运行结果不会自动变成目录项；必要时使用上面的 `[toc]` 手动声明及对应的组件锚点。

桌面端在侧栏展示目录；移动端通过右下角目录按钮打开抽屉，点击条目后自动收起，也可下滑或点击遮罩关闭。Fumadocs 负责可见标题高亮和目录容器自动滚动。阅读百分比单独按正文滚动位置计算：正文开始经过顶部导航下方时起算，正文末尾进入视口时达到 100%，评论区、页脚不计入。密码文章未解锁时不输出正文目录。

标题前的 `#` 提示仍由共享锚点样式控制，默认隐藏，悬停标题时出现；目录在添加这个符号之前提取，因此不会混入装饰符号。Fumadocs 插件说明见[官方文档](https://www.fumadocs.dev/docs/headless/mdx/headings)。

正文图片使用 Astro 默认的 Markdown 图片处理；`public/` 图片保留原有稳定 URL。显式 `<Image />` 仍由组件映射兼容，React 组件使用原生 `<img>`。需要构建时图片优化的新增资源可放入 `src/`，使用 `astro:assets` 的 `Image`。

全站正文使用霞鹜文楷，通过 npm 包 `@chinese-fonts/lxgwwenkai` 引入 Regular（400）和 Medium（500）字重；标题、强调文本和加粗类使用 Medium。代码使用 Astro Fonts API 自托管的 Monaspace Neon。字体由构建工具打包到站点资源中，浏览器按需加载，无需在源码中维护字体文件或连接第三方字体 CDN。

## Vault 同步

在 monorepo 根目录 `.env` 或构建环境中设置 `VAULT_GIT_URL`、私库只读凭据 `VAULT_GIT_TOKEN`，可选 `VAULT_GIT_REF`；本地也可用 `VAULT_PATH` 指向 `~/Documents/pimc-vault`。同步配置见[根目录说明](../../README.md)。Git URL 优先于本地路径；同步失败会中止构建，保留原 contents。

脚本通过 Git 的环境配置注入 HTTPS Authorization header，Token 不放进仓库 URL、命令行参数或客户端变量。内容库推送不会自动触发应用仓库的部署，需要另行配置构建触发器。

## 环境变量与部署

参考 `.env.example`。浏览器变量使用 `PUBLIC_*`，Astro / Vite 会在构建时自动注入；私密变量不要使用 `PUBLIC_` 前缀。
如果部署环境仍保留 `NEXT_PUBLIC_*` 变量，请先重命名为对应的 `PUBLIC_*`，Astro 不会读取旧前缀。

部署使用 `@astrojs/cloudflare` 和 `wrangler.jsonc`。静态页面与资源输出到 `dist/client/`，服务端 Worker 输出到 `dist/server/`。Wrangler 自动读取构建生成的配置，静态资源由 `ASSETS` binding 提供，服务端接口由 Worker 执行。

```sh
bun run build
bun run serve --ip 127.0.0.1 --port 4321
bun run deploy:check

# 首次部署时登录 Cloudflare；CI 可配置 CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID。
bunx --no-install wrangler login
bun run deploy
```

`wrangler.jsonc` 中的 Worker 名称默认是 `naiveblog`，可按需修改。在 Cloudflare Workers Builds 中连接此仓库时，安装命令使用 `bun install --frozen-lockfile`，根目录为 monorepo 根目录，构建命令使用 `bun run build:naive-blog`，部署命令使用 `cd apps/naive-blog && bunx --no-install wrangler deploy`。

`PUBLIC_*` 变量在构建时写入客户端代码，应配置在构建环境中；修改后需要重新构建。`VAULT_GIT_URL` 同样仅用于构建阶段。未来新增的运行时密钥应通过 `wrangler secret put` 配置，不要放进公开前缀变量或提交到仓库。

已启用 `nodejs_compat`，密码接口可使用 Node crypto。项目没有使用 Astro Sessions，因此关闭了 session 支持，不会自动创建 KV namespace；图片使用构建时优化，也不要求 Cloudflare Images binding。静态资源的安全响应头位于 `public/_headers`，动态响应通过 Astro middleware 设置。

OG 图片在 Node 构建阶段为每篇文章生成到 `/og/<文章路径>.png`，文章的 Open Graph / Twitter 元数据直接引用静态图片。Worker 只分发 PNG，不再运行图片渲染器或加载 WASM。`@vercel/og` 仅作为构建依赖；Vercel 专属 Analytics / Speed Insights 已移除。更新文章标题或摘要后需要重新构建图片。

公开页面、`feed.xml`、`robots.txt` 和 `sitemap.xml` 静态生成。以下路由需要服务端运行时，不能直接部署到只提供静态文件的托管服务：

- `POST /api/blog/password`
- `GET /api/3party/netease/playlist`
- 历史链接重定向与未知路径的 404 回退

原有 `/archives/:id`、`/archive.html`、`/about.html`、`/github.html`、`/author/1`、`/page/:page` 和 `/cross.html/*` 链接保持永久重定向。

格式化统一使用 `bun run format`，格式与 oxlint 配置均在仓库根目录维护。后续开发与发布在 pimc 主仓库进行，原仓库不再更新。许可证见仓库根目录 [MIT License](../../LICENSE)。

## 来源

最初基于 [timlrx/tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) 修改，现已迁移至 Astro。

设计参考：[Hayden Bleasel](https://www.haydenbleasel.com/)、[innei.in](https://innei.in/)、Typecho Handsome 主题与 Sakura 主题。

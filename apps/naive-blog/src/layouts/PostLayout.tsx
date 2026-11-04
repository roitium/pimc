import PageTitle from "@/components/PageTitle";
import "@/css/markdown.css";
import { slug as _slug } from "github-slugger";
import Link from "@/components/Link";
import type { ReactNode } from "react";
import categoryMapping from "@/data/category-mapping";
import siteMetadata from "@/data/siteMetadata";
import { Fragment } from "react";
import type { Post } from "@/services/content/core";
import type { CoreContent } from "@/services/content/utils";

const editUrl = (path: string) =>
  `${siteMetadata.siteContentRepo}/blob/main/${path}`;

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

interface LayoutProps {
  content: CoreContent<Post>;
  next?: { path: string; title: string };
  prev?: { path: string; title: string };
  children: ReactNode;
  controls?: ReactNode;
  comments?: ReactNode;
  tableOfContents?: ReactNode;
}

function generateCategoryTree(categories: string[]) {
  const tree: { name: string; displayName: string; url: string }[] = [];
  let nowPath = "";
  for (const category of categories) {
    nowPath += `/${category}`;
    tree.push({
      name: category,
      displayName: categoryMapping[category]
        ? categoryMapping[category].show
        : category,
      url: `/categories${nowPath}`,
    });
  }
  return tree;
}

export default function PostLayout({
  content,
  next,
  prev,
  children,
  controls,
  comments,
  tableOfContents,
}: LayoutProps) {
  const { _meta, path, title, tags, pinned } = content;
  const { date } = content;

  const paths = path.split("/");
  // 去掉最后一个元素，因为它是文章名
  paths.pop();
  const categories = generateCategoryTree(paths);

  return (
    <>
      {controls}
      <article>
        <div className="mx-auto px-4 sm:px-6 xl:px-0">
          <div className="flex flex-col lg:mx-auto lg:max-w-[1048px] lg:flex-row lg:gap-10">
            {/* 主内容区域 */}
            <div className="order-2 lg:flex-1 lg:max-w-[720px] min-w-0">
              {/* 文章头部 */}
              <PostHeader
                date={date}
                title={title}
                pinned={pinned}
                readingTime={content.readingTime}
                indexable={!content.private && !content.draft}
                categories={categories}
                tags={tags}
              />

              {/* 文章内容 */}
              <div className="prose prose-slate dark:prose-invert max-w-none pt-10 pb-8">
                {children}
              </div>

              <PostNavigation next={next} prev={prev} />

              {/* 文章底部链接 */}
              {siteMetadata.siteContentRepo && (
                <div className="pt-6 pb-6 text-center text-slate-11 text-sm dark:text-slatedark-11">
                  <Link href={editUrl(_meta.filePath)}>
                    View on GitHub (If you have access)
                  </Link>
                </div>
              )}

              {/* 评论区域 */}
              {siteMetadata.comments && (
                <div
                  className="pt-6 pb-6 text-center text-slate-11 dark:text-slatedark-11"
                  id="comment"
                >
                  {comments}
                </div>
              )}
            </div>

            {/* 目录 - 右侧边栏（仅桌面显示） */}
            <div className="hidden lg:order-3 lg:block lg:w-[240px] xl:w-[288px] shrink-0">
              {tableOfContents}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

// 文章头部组件
function PostHeader({
  date,
  title,
  pinned,
  readingTime,
  indexable,
  categories,
  tags,
}: Pick<
  CoreContent<Post>,
  "date" | "title" | "pinned" | "readingTime" | "tags"
> & {
  indexable: boolean;
  categories: ReturnType<typeof generateCategoryTree>;
}) {
  return (
    <header className="border-b border-slate-5 pt-6 pb-6 dark:border-slatedark-5">
      <div className="space-y-1 text-center">
        <nav
          aria-label="文章分类"
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-11 dark:text-slatedark-11"
        >
          {categories.map((category, index) => (
            <Fragment key={category.url}>
              {index > 0 && <span aria-hidden="true">/</span>}
              <Link
                href={category.url}
                className="transition-colors hover:text-blue-11 dark:hover:text-skydark-11"
              >
                {category.displayName}
              </Link>
            </Fragment>
          ))}
        </nav>
        <div>
          <PageTitle title={title} indexable={indexable} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] lg:text-sm text-slate-11 dark:text-slatedark-11">
            <time dateTime={date.toISOString()} className="inline">
              {new Date(date).toLocaleDateString(
                siteMetadata.locale,
                postDateTemplate,
              )}
              {pinned ? "  (置顶博文)" : ""}
            </time>
            <span className="inline" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center">
              <svg
                role="img"
                aria-label="clock"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-[18px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              预计阅读时长：
              {Math.ceil(readingTime)}
              分钟
            </span>
            {tags.length > 0 && (
              <span className="inline" aria-hidden="true">
                ·
              </span>
            )}
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${_slug(tag)}`}
                className="transition-colors hover:text-blue-11 dark:hover:text-skydark-11"
              >
                #{tag.split(" ").join("-")}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function PostNavigation({ next, prev }: Pick<LayoutProps, "next" | "prev">) {
  if (!next && !prev) return null;

  return (
    <nav aria-label="相邻文章" className="grid gap-4 py-6 sm:grid-cols-2">
      {prev && (
        <Link
          href={`/${prev.path}`}
          rel="prev"
          className="group flex min-w-0 flex-col gap-3 rounded-2xl bg-slate-3 p-5 transition duration-200 hover:bg-slate-4 hover:shadow-sm dark:bg-slatedark-3 dark:hover:bg-slatedark-4"
        >
          <span className="text-sm text-slate-11 dark:text-slatedark-11">
            ← 上一篇
          </span>
          <span className="break-words font-medium text-slate-12 transition-colors group-hover:text-blue-11 dark:text-slatedark-12 dark:group-hover:text-skydark-11">
            {prev.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          href={`/${next.path}`}
          rel="next"
          className="group flex min-w-0 flex-col gap-3 rounded-2xl bg-slate-3 p-5 text-right transition duration-200 hover:bg-slate-4 hover:shadow-sm sm:col-start-2 dark:bg-slatedark-3 dark:hover:bg-slatedark-4"
        >
          <span className="text-sm text-slate-11 dark:text-slatedark-11">
            下一篇 →
          </span>
          <span className="break-words font-medium text-slate-12 transition-colors group-hover:text-blue-11 dark:text-slatedark-12 dark:group-hover:text-skydark-11">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}

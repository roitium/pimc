import {
  useArticleReadingProgress,
  useScrollControlsVisible,
} from "@pimc/content/components/toc";
import type { Toc } from "@pimc/content/toc";
import { TOCDrawer } from "./TOCDrawer";

interface ArticleControlsProps {
  toc?: Toc;
}

export default function ArticleControls({ toc }: ArticleControlsProps) {
  const show = useScrollControlsVisible();
  const progress = useArticleReadingProgress();

  return (
    <div
      inert={!show}
      aria-hidden={!show}
      className={`fixed right-8 bottom-8 z-50 flex flex-col items-center gap-3 transition-[opacity,translate] duration-200 motion-reduce:transition-none ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"} lg:hidden`}
    >
      {toc && <TOCDrawer toc={toc} />}
      <button
        aria-label={`返回顶部，已阅读 ${progress}%`}
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          })
        }
        className="relative flex size-11 items-center justify-center rounded-full bg-gray-200 text-gray-500 shadow-sm transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 44 44"
          className="pointer-events-none absolute inset-0 size-11 -rotate-90 fill-none"
          strokeWidth="2"
        >
          <circle
            cx="22"
            cy="22"
            r="20"
            className="stroke-slate-6 dark:stroke-slatedark-6"
          />
          <circle
            cx="22"
            cy="22"
            r="20"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            className="stroke-blue-11 transition-[stroke-dashoffset] duration-150 motion-reduce:transition-none dark:stroke-bluedark-11"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="size-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

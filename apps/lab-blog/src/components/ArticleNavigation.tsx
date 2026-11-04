import { useState } from "react";
import { Drawer } from "vaul";
import TOC, { useArticleReadingProgress } from "@pimc/content/components/toc";
import type { Toc } from "@pimc/content/toc";

export default function ArticleNavigation({ toc }: { toc: Toc }) {
  const [open, setOpen] = useState(false);
  const progress = useArticleReadingProgress(16);

  return (
    <>
      <div
        className="lab-reading-progress"
        aria-hidden="true"
        style={{ width: `${progress}%` }}
      />
      <aside
        className="lab-toc-sidebar"
        aria-label="文章阅读导航"
        data-pagefind-ignore
      >
        <div className="lab-toc-sticky">
          <h2 className="lab-toc-title">本文目录</h2>
          <TOC toc={toc} headingOffset={16} />
        </div>
      </aside>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger className="lab-toc-trigger" aria-label="打开目录">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path
              d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              strokeLinecap="round"
            />
          </svg>
          <span>目录</span>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="lab-toc-overlay" />
          <Drawer.Content
            className="lab-toc-drawer"
            aria-describedby={undefined}
            data-pagefind-ignore
          >
            <div className="lab-toc-handle" aria-hidden="true" />
            <Drawer.Title className="lab-toc-title">本文目录</Drawer.Title>
            <div className="lab-toc-drawer-body">
              <TOC
                toc={toc}
                headingOffset={16}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

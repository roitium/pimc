import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  AnchorProvider,
  ScrollProvider,
  TOCItem,
  useActiveAnchor,
  useActiveAnchors,
} from "fumadocs-core/toc";
import type { Toc } from "@pimc/content/toc";

export interface TOCInlineProps {
  toc?: Toc;
  onNavigate?: () => void;
  headingOffset?: number;
  animatedIndicator?: boolean;
}

export function useArticleReadingProgress(headingOffset = 80) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.querySelector<HTMLElement>("[data-article-body]");
    if (!article) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      // Start below the fixed header; finish when the last line enters view.
      const start = rect.top + window.scrollY - headingOffset;
      const end = rect.bottom + window.scrollY - window.innerHeight;
      const ratio =
        end <= start
          ? rect.bottom <= window.innerHeight
            ? 1
            : 0
          : (window.scrollY - start) / (end - start);
      setProgress(Math.round(Math.min(1, Math.max(0, ratio)) * 100));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(article);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [headingOffset]);

  return progress;
}

function ReadingProgress({ headingOffset }: { headingOffset: number }) {
  const progress = useArticleReadingProgress(headingOffset);

  return (
    <div className="article-toc-progress">
      <div className="article-toc-progress-label">
        <span>阅读进度</span>
        <span className="tabular-nums">{progress}%</span>
      </div>
      <progress aria-label="正文阅读进度" max={100} value={progress} />
    </div>
  );
}

function ActiveIndicator({
  trackRef,
}: {
  trackRef: RefObject<HTMLDivElement | null>;
}) {
  const activeAnchors = useActiveAnchors();
  const [bounds, setBounds] = useState<{ top: number; height: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const anchors = track.querySelectorAll<HTMLElement>(
        'a[data-active="true"]',
      );
      if (!anchors.length || !track.getClientRects().length) {
        setBounds(null);
        return;
      }
      const origin = track.getBoundingClientRect().top;
      const first = anchors[0].getBoundingClientRect();
      const last = anchors[anchors.length - 1].getBoundingClientRect();
      const top = first.top - origin;
      const height = last.bottom - first.top;
      setBounds((previous) =>
        previous?.top === top && previous.height === height
          ? previous
          : { top, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [activeAnchors, trackRef]);

  return (
    bounds && (
      <span
        aria-hidden="true"
        className="article-toc-indicator"
        style={{
          transform: `translateY(${bounds.top}px)`,
          height: bounds.height,
        }}
      />
    )
  );
}

function TOCLinks({
  toc,
  onNavigate,
  animatedIndicator,
}: Required<Pick<TOCInlineProps, "toc">> &
  Pick<TOCInlineProps, "onNavigate" | "animatedIndicator">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const active = useActiveAnchor();
  const minDepth = Math.min(...toc.map((item) => item.depth));

  return (
    <div
      ref={containerRef}
      className="article-toc-scroll"
      tabIndex={0}
      aria-label="文章目录，可滚动"
    >
      <ScrollProvider containerRef={containerRef}>
        <div className="article-toc-track" ref={trackRef}>
          <ul className="article-toc-list">
            {toc.map((item) => (
              <li key={item.url}>
                <TOCItem
                  href={item.url}
                  aria-current={
                    active === item.url.slice(1) ? "location" : undefined
                  }
                  style={{
                    paddingInlineStart: 16 + (item.depth - minDepth) * 12,
                  }}
                  onClick={onNavigate}
                >
                  {item.title}
                </TOCItem>
              </li>
            ))}
          </ul>
          {animatedIndicator && <ActiveIndicator trackRef={trackRef} />}
        </div>
      </ScrollProvider>
    </div>
  );
}

export default function TOC({
  toc = [],
  onNavigate,
  headingOffset = 80,
  animatedIndicator = true,
}: TOCInlineProps) {
  return (
    <div
      className="article-toc"
      data-animated-indicator={animatedIndicator || undefined}
    >
      <ReadingProgress headingOffset={headingOffset} />
      {toc.length > 0 && (
        <nav aria-label="文章目录">
          <AnchorProvider toc={toc}>
            <TOCLinks
              toc={toc}
              onNavigate={onNavigate}
              animatedIndicator={animatedIndicator}
            />
          </AnchorProvider>
        </nav>
      )}
    </div>
  );
}

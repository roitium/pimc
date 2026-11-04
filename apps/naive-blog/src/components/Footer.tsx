import siteMetadata from "@/data/siteMetadata";
import { Monitor, Moon, Sun } from "lucide-react";

const themes = [
  { value: "light", label: "浅色", Icon: Sun },
  { value: "dark", label: "深色", Icon: Moon },
  { value: "system", label: "跟随系统", Icon: Monitor },
] as const;

export default function Footer() {
  const built = new Date(import.meta.env.PUBLIC_BUILD_TIME);
  return (
    <footer>
      <div className="mt-16 mb-8 flex select-none flex-col items-center">
        <span className="mb-2 text-gray-500 text-sm dark:text-neutral-400">
          {"Ciallo ～(∠・ω< )⌒★!"}
        </span>
        <div className="mb-2 flex space-x-2 text-gray-500 text-sm dark:text-neutral-400">
          <span>{siteMetadata.author}</span>
          <span> • </span>
          <span>© {built.getFullYear()}</span>
          <span> • </span>
          <span>{siteMetadata.title}</span>
        </div>
        <div
          role="group"
          aria-label="外观主题"
          className="mt-1 mb-4 inline-flex gap-1 rounded-full border border-slate-6 bg-slate-3/60 p-1 text-xs text-slate-11 dark:border-slatedark-6 dark:bg-slatedark-3 dark:text-slatedark-11"
        >
          {themes.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              data-theme-option={value}
              aria-pressed={siteMetadata.theme === value}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 transition-colors hover:bg-slate-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-9 aria-pressed:bg-slate-1 aria-pressed:text-blue-11 aria-pressed:shadow-xs dark:hover:bg-slatedark-4 dark:aria-pressed:bg-slatedark-5 dark:aria-pressed:text-skydark-11 motion-reduce:transition-none"
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <span
          className="text-gray-500 text-sm dark:text-neutral-400"
          title={`最近一次提交 hash: ${import.meta.env.PUBLIC_COMMIT_HASH?.slice(0, 6) || "unknown"}`}
        >
          构建时间：{built.toUTCString()}
        </span>
      </div>
    </footer>
  );
}

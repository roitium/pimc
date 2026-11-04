import lightGallery from "lightgallery";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
let galleries: ReturnType<typeof lightGallery>[] = [];
const copyLabel = "复制";

function attachCopyButtons() {
  document.querySelectorAll<HTMLPreElement>("article pre").forEach((pre) => {
    if (pre.closest("[data-code-block]")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "relative";
    wrapper.dataset.codeBlock = "";
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "复制代码");
    button.dataset.copyCode = "";
    button.textContent = copyLabel;
    button.className =
      "absolute right-2 z-10 rounded border border-slate-7 bg-slate-3 px-2 py-1 text-xs text-slate-12 dark:bg-slatedark-3 dark:text-slatedark-12";
    // Sit above the code block, or level with the optional file-name label.
    button.style.top = pre.classList.contains("mt-8")
      ? "var(--file-name-offset, -0.75rem)"
      : "-0.75rem";
    pre.appendChild(button);
    button.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.textContent ?? "";
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "已复制";
      } catch {
        button.textContent = "复制失败";
      }
      setTimeout(() => {
        button.textContent = copyLabel;
      }, 2000);
    });
  });
}

export function initArticle() {
  galleries.forEach((gallery) => gallery.destroy());
  galleries = Array.from(
    document.querySelectorAll<HTMLElement>("[data-article-gallery]"),
  ).map((element) =>
    lightGallery(element, {
      selector: "img",
      plugins: [lgThumbnail, lgZoom],
      speed: 500,
      licenseKey: import.meta.env.PUBLIC_LIGHT_GALLERY_LICENSE_KEY,
    }),
  );
  attachCopyButtons();
}
document.addEventListener("astro:before-swap", () => {
  galleries.forEach((gallery) => gallery.destroy());
  galleries = [];
});

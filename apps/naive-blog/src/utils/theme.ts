import site from "@/data/siteMetadata";

type Theme = "light" | "dark" | "system";

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "system";

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem("theme");
    if (isTheme(saved)) return saved;
  } catch {
    // Storage may be unavailable; use the site's default preference.
  }
  return site.theme;
}

const systemTheme = matchMedia("(prefers-color-scheme: dark)");
let theme = readTheme();

function applyTheme() {
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark" || (theme === "system" && systemTheme.matches),
  );
  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-option]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeOption === theme),
      );
    });
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>(
    "button[data-theme-option]",
  );
  const next = button?.dataset.themeOption;
  if (!isTheme(next)) return;
  theme = next;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Keep the selection working for this page session without storage.
  }
  applyTheme();
});

systemTheme.addEventListener("change", () => {
  if (theme === "system") applyTheme();
});

window.addEventListener("storage", (event) => {
  if (event.key === "theme" || event.key === null) {
    theme = readTheme();
    applyTheme();
  }
});

document.addEventListener("astro:page-load", applyTheme);
applyTheme();

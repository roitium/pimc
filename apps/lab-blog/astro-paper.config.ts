import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    // TODO: 换成你的正式域名（必须带协议和结尾斜杠），例如 "https://blog.example.com/"
    url: "https://lab-blog.roitium.com/",
    title: "Roitium 3G Lab Blog",
    description: "只是单纯存放在实验室产出的博文、感想、周报等。",
    author: "Roitium",
    profile: "https://github.com/roitium",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
    // googleVerification: "your-google-site-verification-value",
  },
  home: {
    greeting: "氦！",
    intro: "该博客仅用于存放和展示 Roitium 在 3G 实验室产出的博文、周报与感想",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      // TODO: 换成你自己的仓库地址，或在不需要 “编辑此页” 时改为 { enabled: false }
      enabled: true,
      url: "https://github.com/roitium/lab-blog/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    // 图标文件名来自 src/assets/icons/socials/，可用：github / x / linkedin / mail 等
    { name: "github", url: "https://github.com/roitium" },
    { name: "mail", url: "mailto:me@roitium.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});

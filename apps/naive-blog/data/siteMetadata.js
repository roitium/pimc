import { email } from "./identity.js";

/** @type {import("../src/types/siteMetadata").SiteConfig } */
const siteMetadata = {
  title: "Roitiumの自留地",
  author: "Roitium",
  description: "Be young & simple, even sometimes naive. ",
  language: "zh-cn",
  theme: "system", // system, dark or light
  siteUrl: "https://www.roitium.com",
  siteContentRepo: import.meta.env.PUBLIC_VAULT_REPO_URL || "",
  email,
  github: "https://github.com/roitium",
  x: "https://x.com/yoshino_2333",
  locale: "zh-CN",
  comments: {
    provider: "giscus",
    giscusConfig: {
      repo: import.meta.env.PUBLIC_GISCUS_REPO,
      repositoryId: import.meta.env.PUBLIC_GISCUS_REPOSITORY_ID,
      categories: import.meta.env.PUBLIC_GISCUS_CATEGORY,
      categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID,
      mapping: "pathname",
      reactions: "1",
      metadata: "0",
      theme: "light",
      darkTheme: "transparent_dark",
      themeURL: "",
      lang: "zh-CN",
    },
  },
};

siteMetadata.socialBanner = "/og.png";

export default siteMetadata;

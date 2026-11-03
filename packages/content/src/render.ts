import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/** HTML rendering for RSS and other non-Astro content. Safe HTML is the default. */
export function createHtmlProcessor({
  remarkPlugins = [],
  allowHtml = false,
  sanitize = true,
}: {
  remarkPlugins?: PluggableList;
  allowHtml?: boolean;
  sanitize?: boolean;
} = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkPlugins)
    .use(remarkRehype, { allowDangerousHtml: allowHtml });
  if (sanitize) processor.use(rehypeSanitize);
  return processor.use(rehypeStringify, { allowDangerousHtml: allowHtml });
}

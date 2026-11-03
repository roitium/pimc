/** An index file represents its containing article directory. */
export function normalizeArticleSlug(slug: string): string {
  const path = slug.replace(/^\/+|\/+$/g, "").replace(/(?:^|\/)index$/, "");
  if (!path)
    throw new Error(
      "index.md / index.mdx 必须位于具名文章目录中，不能占用文章列表首页。",
    );
  return path;
}

type Entry = { entry: string; base: URL; data: Record<string, unknown> };

/** Validate before glob writes to its store, where duplicate IDs would overwrite. */
export function createArticleIdGenerator(
  generateId: (entry: Entry) => string,
  getPath: (id: string, entry: Entry) => string,
) {
  const paths = new Map<string, string>();
  const ids = new Map<string, string>();
  const sources = new Map<string, { path: string; id: string }>();
  function forget(source: string) {
    const previous = sources.get(source);
    if (!previous) return;
    paths.delete(previous.path);
    ids.delete(previous.id);
    sources.delete(source);
  }
  return {
    reset() {
      paths.clear();
      ids.clear();
      sources.clear();
    },
    forget,
    generateId(entry: Entry) {
      const id = generateId(entry);
      const path = getPath(id, entry);
      for (const [kind, owner] of [
        ["URL", paths.get(path)],
        ["内容 ID", ids.get(id)],
      ]) {
        if (owner && owner !== entry.entry)
          throw new Error(
            `文章 ${kind} 冲突：${path}，文件 ${owner} 与 ${entry.entry}。`,
          );
      }
      forget(entry.entry);
      paths.set(path, entry.entry);
      ids.set(id, entry.entry);
      sources.set(entry.entry, { path, id });
      return id;
    },
  };
}

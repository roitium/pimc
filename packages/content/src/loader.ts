import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { glob, type Loader } from "astro/loaders";
import { createArticleIdGenerator } from "./paths";
import { z, postFields } from "./schema";

type GlobOptions = Parameters<typeof glob>[0];
type GenerateId = NonNullable<GlobOptions["generateId"]>;

export function createArticleLoader({
  base,
  pattern = "**/*.{md,mdx}",
  generateId,
  getPath,
  target,
}: {
  base: string | URL;
  pattern?: GlobOptions["pattern"];
  generateId: GenerateId;
  getPath: (id: string, entry: Parameters<GenerateId>[0]) => string;
  target?: "lab" | "personal";
}): Loader {
  const ids = createArticleIdGenerator(generateId, getPath);
  const selectionSchema = z.object({ publish_to: postFields.publish_to });
  const selected = (data: Record<string, unknown>) =>
    !target || selectionSchema.parse(data).publish_to.includes(target);
  const loader = glob({
    base,
    pattern,
    deferRender: true,
    generateId(entry) {
      if (selected(entry.data)) return ids.generateId(entry);
      ids.forget(entry.entry);
      return `__unpublished__/${entry.entry}`;
    },
  });
  const watched = new WeakSet();
  return {
    ...loader,
    name: "pimc-article-loader",
    async load(context) {
      ids.reset();
      if (context.watcher && !watched.has(context.watcher)) {
        watched.add(context.watcher);
        const directory = fileURLToPath(
          base instanceof URL
            ? base
            : new URL(`${base.replace(/\/$/, "")}/`, context.config.root),
        );
        context.watcher.on("unlink", (file) =>
          ids.forget(relative(directory, file).replaceAll("\\", "/")),
        );
      }
      // Filter before schema validation/module registration, so private notes and
      // another site's components never enter this site's compilation graph.
      await loader.load({
        ...context,
        parseData: (entry) =>
          selected(entry.data)
            ? context.parseData(entry)
            : Promise.resolve(entry.data),
        store: {
          ...context.store,
          set(entry) {
            if (selected(entry.data)) return context.store.set(entry);
            context.store.delete(entry.id);
            return false;
          },
        },
      });
    },
  };
}

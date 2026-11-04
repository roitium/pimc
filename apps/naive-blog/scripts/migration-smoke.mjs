import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { existsSync, openSync, closeSync, copyFileSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { startWorker } from "./worker-test-server.mjs";

process.env.NODE_ENV = "production";

const fixture = path.resolve(
  "../../contents/personal-blog/posts/__astro_smoke_test__",
);
assert(!existsSync(fixture), `Refusing to overwrite ${fixture}`);
const secret = "astro-protected-body-marker-2981";
const password = "astro-test-password-2981";
const base = (process.env.BASE_PATH || "").replace(/\/$/, "");
const output = `dist/client${base}`;
let worker;
const html = async (url) =>
  readFile(path.join(output, url, "index.html"), "utf8");
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(dir, entry.name))
          : [path.join(dir, entry.name)],
      ),
    )
  ).flat();
}

try {
  await mkdir(`${fixture}/nested/中文`, { recursive: true });
  await mkdir(`${fixture}/plain`, { recursive: true });
  await mkdir(`${fixture}/private`, { recursive: true });
  await writeFile(
    `${fixture}/nested/中文/InlineDemo.tsx`,
    "export default function InlineDemo() { return <span>local-component-marker-74529</span>; }",
  );
  copyFileSync(
    "public/static/images/logo.png",
    `${fixture}/nested/中文/fixture.png`,
  );
  copyFileSync("public/static/images/logo.png", `${fixture}/plain/fixture.png`);
  await writeFile(
    `${fixture}/nested/中文/index.mdx`,
    `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: Astro smoke test 中文\ndate: '2026-11-02T00:00:00+08:00'\ntags: [AstroSmoke]\ndescription: Smoke test\n---\nimport InlineDemo from "./InlineDemo.tsx";\n\n<InlineDemo />\n\n![Bundled image](./fixture.png)\n\n## Repeated\n\n> [!NOTE]\n> Shared callout marker 74529\n\nPublic body marker $E=mc^2$.\n\n## Repeated\n\n\`\`\`ts file="example.ts"\n// [!code highlight]\nconst answer = 42\n\`\`\`\n\n![Logo](/static/images/logo.png)\n\n<GCPlay />\n`,
  );
  await writeFile(
    `${fixture}/plain/index.md`,
    `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: '2024-04-15'\ndate: '2026-10-20T00:00:00+08:00'\n---\n![Relative image](./fixture.png)\n\n![Logo](/static/images/logo.png)\n`,
  );
  await writeFile(
    `${fixture}/private/index.mdx`,
    `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: Protected smoke test\ndate: '2026-11-02T00:00:00+08:00'\npassword: '${password}'\ntags: [ProtectedSmokeTag]\n---\n## Private heading\n\n${secret} $E=mc^2$.\n\n![Relative image](./fixture.png)\n\n\`\`\`ts\nconst privateAnswer = 42\n\`\`\`\n\n<GCPlay />\n`,
  );
  copyFileSync(
    "public/static/images/logo.png",
    `${fixture}/private/fixture.png`,
  );
  await writeFile(
    `${fixture}/other-private.mdx`,
    `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: Another protected post\ndate: '2026-11-02T00:00:00+08:00'\npassword: '${password}'\n---\nother-private-body-marker-2981\n`,
  );
  await mkdir(`${fixture}/private-only`, { recursive: true });
  await writeFile(
    `${fixture}/private-only/listed.mdx`,
    `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: Listed protected article\ndate: '2026-11-03T00:00:00+08:00'\npassword: '${password}'\ntags: [PrivateOnlyTag]\n---\nprivate-only-body-marker-2981\n`,
  );
  await writeFile(
    `${fixture}/draft.mdx`,
    `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: Draft smoke test\ndate: '2026-11-02T00:00:00+08:00'\ndraft: true\ntags: [DraftSmokeTag]\n---\nastro-draft-body-marker-2981\n`,
  );
  for (let i = 1; i <= 6; i++)
    await writeFile(
      `${fixture}/page-${i}.mdx`,
      `---\nid: ${randomUUID()}\npublish_to: [personal]\ntitle: Pagination smoke ${i}\ndate: '2026-10-20T00:00:00+08:00'\ntags: [AstroSmoke]\n---\nPage ${i}\n`,
    );
  await writeFile(
    `${fixture}/unpublished.mdx`,
    `---\nid: ${randomUUID()}\ntitle: Unpublished vault note\npublish_to: []\ndate: '2026-10-20T00:00:00+08:00'\n---\nimport NeverCompile from "./not-present-on-purpose";\n\n<NeverCompile />\n\nastro-unpublished-body-marker-2981\n`,
  );
  const sharedDemo = `${fixture}/PrivateDemo.tsx`;
  await writeFile(
    sharedDemo,
    "export default function PrivateDemo() { return <span>private-local-component-74529</span>; }",
  );
  for (const file of await files(fixture)) {
    if (!file.endsWith(".mdx")) continue;
    let body = await readFile(file, "utf8");
    if (body.includes("<GCPlay />")) {
      body = body.replaceAll("<GCPlay />", "<PrivateDemo />");
      const specifier =
        "./" +
        path.relative(path.dirname(file), sharedDemo).replaceAll("\\", "/");
      body = body.replace(
        /^(---\n[\s\S]*?\n---\n)/,
        `$1import PrivateDemo from "${specifier}";\n\n`,
      );
      await writeFile(file, body);
    }
  }
  const log = "/tmp/naiveblog-migration-smoke-build.log";
  const logFile = openSync(log, "w");
  try {
    execFileSync("bun", ["run", "build:site"], {
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", logFile, "pipe"],
    });
  } catch (error) {
    console.error(await readFile(log, "utf8"));
    throw error;
  } finally {
    closeSync(logFile);
  }
  const article = await html("blog/__astro_smoke_test__/nested/中文");
  const markdown = await html("blog/__astro_smoke_test__/plain");
  assert(markdown.includes("<title>2024-04-15"));
  assert(markdown.includes(">2024-04-15</h1>"));
  assert(markdown.includes(`${base}/static/images/logo.png`));
  assert(article.includes("Public body marker"));
  assert(article.includes("local-component-marker-74529"));
  assert(article.includes('alt="Bundled image"'));
  assert(markdown.includes('alt="Relative image"'));
  assert(
    !existsSync(`${output}/blog/__astro_smoke_test__/plain/index/index.html`),
  );
  assert(
    !existsSync(
      `${output}/blog/__astro_smoke_test__/nested/中文/index/index.html`,
    ),
  );
  assert(article.includes('class="katex"'));
  assert(article.includes('class="astro-code'));
  assert(article.includes("example.ts"));
  assert(article.includes("highlighted"));
  assert(article.includes("data-copy-code"));
  assert(article.includes('id="repeated-1"'));
  assert(article.includes('href="#repeated-1"'));
  assert(article.includes('class="heading-anchor"'));
  assert(article.includes("Shared callout marker 74529"));
  assert(article.includes("callout"));
  assert(!article.includes("markdown-alert"));
  assert(article.includes("private-local-component-74529"));
  assert(article.includes(`${base}/static/images/logo.png`));
  assert(
    article.includes(
      `${base}/og/__astro_smoke_test__/nested/%E4%B8%AD%E6%96%87.png`,
    ),
  );
  assert(existsSync(`${output}/og/__astro_smoke_test__/nested/中文.png`));
  const png = await readFile(
    `${output}/og/__astro_smoke_test__/nested/中文.png`,
  );
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  await writeFile("/tmp/naiveblog-og-smoke.png", png);
  assert((await html("blog/page/2")).includes("上一页"));
  assert((await html("tags/astrosmoke")).includes("Astro smoke test"));
  assert(
    (await html("categories/blog/__astro_smoke_test__/nested")).includes(
      "Astro smoke test",
    ),
  );
  assert(!existsSync(`${output}/blog/__astro_smoke_test__/private/index.html`));
  assert(!existsSync(`${output}/blog/__astro_smoke_test__/draft/index.html`));
  assert(
    !existsSync(`${output}/blog/__astro_smoke_test__/unpublished/index.html`),
  );
  for (const file of await files(output)) {
    if (!/\.(?:html|js|json|xml|txt|map)$/.test(file)) continue;
    const text = await readFile(file, "utf8");
    for (const marker of [
      secret,
      "other-private-body-marker-2981",
      "private-only-body-marker-2981",
      JSON.parse(await readFile("src/generated/private-post-key.json", "utf8"))
        .key,
      password,
      "astro-draft-body-marker-2981",
      "astro-unpublished-body-marker-2981",
      "Unpublished vault note",
      createHash("sha256").update(password).digest("hex"),
    ])
      assert(!text.includes(marker), `Protected content leaked into ${file}`);
  }
  for (const name of ["feed.xml", "sitemap.xml"]) {
    const text = await readFile(`${output}/${name}`, "utf8");
    if (name === "sitemap.xml") {
      const urls = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(
        (match) => new URL(match[1]).pathname,
      );
      assert(!urls.includes(`${base}/blog/__astro_smoke_test__/private`));
      assert(
        !urls.includes(`${base}/blog/__astro_smoke_test__/private-only/listed`),
      );
    } else assert(!text.includes("__astro_smoke_test__/private"), name);
    assert(!text.includes("Protected smoke test"), name);
    assert(!text.includes("Listed protected article"), name);
    assert(!text.includes("__astro_smoke_test__/draft"), name);
  }
  assert((await html("search")).includes('id="pagefind-search"'));
  assert(existsSync(`${output}/pagefind/pagefind.js`));
  assert(!existsSync(`${output}/search.json`));
  const fragments = await Promise.all(
    (await files(`${output}/pagefind/fragment`)).map(async (file) =>
      gunzipSync(await readFile(file))
        .toString("utf8")
        .replaceAll("\u200b", ""),
    ),
  );
  const indexed = fragments.join("\n");
  assert(indexed.includes("Public body marker"));
  assert(indexed.includes("Astro smoke test 中文"));
  assert(!indexed.includes("Protected smoke test"));
  assert(!indexed.includes("Listed protected article"));
  assert(!indexed.includes("Draft smoke test"));
  assert(!indexed.includes(secret));
  assert(!indexed.includes("other-private-body-marker-2981"));
  assert(!indexed.includes("private-only-body-marker-2981"));
  assert(!indexed.includes("astro-unpublished-body-marker-2981"));
  const blog = await html("blog");
  assert(blog.includes("Protected smoke test"));
  assert(blog.includes("Listed protected article"));
  assert(!blog.includes("Draft smoke test"));
  assert((await html("")).includes("Listed protected article"));
  assert(
    (await html("tags/protectedsmoketag")).includes("Protected smoke test"),
  );
  assert(
    (await html("tags/privateonlytag")).includes("Listed protected article"),
  );
  assert(
    (await html("categories/blog/__astro_smoke_test__/private-only")).includes(
      "Listed protected article",
    ),
  );
  worker = await startWorker({ base });
  const request = (url, init) =>
    fetch(`${worker.origin}${base}${url}`, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
    });
  const staticResponse = await request("/blog");
  assert.equal(staticResponse.status, 200);
  assert.equal(staticResponse.headers.get("x-content-type-options"), "nosniff");
  assert(
    staticResponse.headers
      .get("content-security-policy")
      ?.includes("frame-ancestors 'none'"),
  );
  const privateURL = "/blog/__astro_smoke_test__/private";
  const locked = await request(privateURL);
  assert.equal(locked.status, 200);
  assert(
    locked.headers
      .get("content-security-policy")
      ?.includes("frame-ancestors 'none'"),
  );
  assert.equal(locked.headers.get("cache-control"), "private, no-store");
  assert.equal(locked.headers.get("vary"), "Cookie");
  const gate = await locked.text();
  assert(gate.includes("article-password"));
  assert(gate.includes("noindex, nofollow"));
  assert(!gate.includes(secret));
  assert(!gate.includes("Private heading"));
  const unlock = (body) =>
    request("/api/blog/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await unlock({ slug: "__astro_smoke_test__/private", password: "wrong" }))
      .status,
    401,
  );
  assert.equal((await unlock({ slug: "__proto__", password })).status, 401);
  assert.equal(
    (await unlock({ slug: "__astro_smoke_test__/nested/中文", password }))
      .status,
    401,
  );
  assert.equal(
    (await unlock({ slug: "__astro_smoke_test__/draft", password })).status,
    401,
  );
  assert.equal((await unlock({})).status, 400);
  assert.equal((await unlock(null)).status, 400);
  const result = await unlock({
    slug: "__astro_smoke_test__/private",
    password,
  });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "private, no-store");
  const data = await result.json();
  assert.deepEqual(data, { ok: true });
  const setCookie = result.headers.get("set-cookie");
  assert(setCookie.includes("HttpOnly"));
  assert(setCookie.includes("SameSite=Lax"));
  assert(setCookie.includes(`Path=${base}/blog/`));
  assert(setCookie.includes("Max-Age=604800"));
  const cookie = setCookie.split(";")[0];
  const signingKey = JSON.parse(
    await readFile("src/generated/private-post-key.json", "utf8"),
  ).key;
  const makeToken = (slug, articlePassword, expires) =>
    `${expires}.${createHmac("sha256", signingKey)
      .update(JSON.stringify([slug, articlePassword, String(expires)]))
      .digest("hex")}`;

  const authenticated = await request(privateURL, {
    headers: { Cookie: cookie },
  });
  assert.equal(authenticated.status, 200);
  assert.equal(authenticated.headers.get("cache-control"), "private, no-store");
  const unlocked = await authenticated.text();
  assert(unlocked.includes(secret));
  assert(unlocked.includes('id="private-heading"'));
  assert(unlocked.includes('class="katex"'));
  assert(unlocked.includes("data-copy-code"));
  assert(unlocked.includes("private-local-component-74529"));
  assert(unlocked.includes('alt="Relative image"'));
  assert(!unlocked.includes("article-password"));
  assert(!unlocked.includes(password));
  const imageURL = unlocked.match(
    /<img[^>]*src="([^"]+)"[^>]*alt="Relative image"/,
  )?.[1];
  assert(imageURL, "Native relative image was not rendered");
  const imageResponse = await fetch(new URL(imageURL, worker.origin));
  assert.equal(imageResponse.status, 200);
  // A signature belongs to one article, even when two articles share a password.
  const otherUnlock = await unlock({
    slug: "__astro_smoke_test__/other-private",
    password,
  });
  const otherCookieName = otherUnlock.headers.get("set-cookie").split("=")[0];
  const other = await request("/blog/__astro_smoke_test__/other-private", {
    headers: { Cookie: `${otherCookieName}=${cookie.split("=")[1]}` },
  });
  assert(!(await other.text()).includes("other-private-body-marker-2981"));
  const tampered = cookie.slice(0, -1) + (cookie.endsWith("0") ? "1" : "0");
  assert(
    !(
      await (
        await request(privateURL, { headers: { Cookie: tampered } })
      ).text()
    ).includes(secret),
  );
  const cookieName = cookie.split("=")[0];
  const expired = `${cookieName}=${makeToken("__astro_smoke_test__/private", password, 1000000000)}`;
  assert(
    !(
      await (await request(privateURL, { headers: { Cookie: expired } })).text()
    ).includes(secret),
  );
  const oldPassword = `${cookieName}=${makeToken("__astro_smoke_test__/private", "previous-password", Math.floor(Date.now() / 1000) + 3600)}`;
  assert(
    !(
      await (
        await request(privateURL, { headers: { Cookie: oldPassword } })
      ).text()
    ).includes(secret),
  );
  assert(!(await (await request(privateURL)).text()).includes(secret));
  const foreignOrigin = await request("/api/blog/password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://example.invalid",
    },
    body: JSON.stringify({ slug: "__astro_smoke_test__/private", password }),
  });
  assert.equal(foreignOrigin.status, 403);
  assert.equal((await request("/api/blog/password")).status, 404);
  for (const url of [
    "/blog/__astro_smoke_test__/draft",
    "/blog/missing-post-2981",
    "/blog/page/999999",
    "/tags/missing-tag-2981",
  ])
    assert.equal((await request(url)).status, 404, url);
  const missing = await request("/not-an-existing-page-2981");
  assert.equal(missing.status, 404);
  assert((await missing.text()).includes("你来到了神隐之地"));
  assert.equal(missing.headers.get("x-content-type-options"), "nosniff");
  const og = await request(
    "/og/__astro_smoke_test__/nested/%E4%B8%AD%E6%96%87.png",
  );
  assert.equal(og.status, 200);
  assert.equal(og.headers.get("content-type"), "image/png");
  assert((await og.arrayBuffer()).byteLength > 1000);
  assert.equal((await request("/api/3party/netease/playlist")).status, 400);
  assert.equal((await request("/api/og/image/post?title=old")).status, 404);
  console.log(
    "Migration smoke passed: static routes, MDX, pagination, protected content, APIs, OG and 404.",
  );
} finally {
  await worker?.stop();
  await rm(fixture, { recursive: true, force: true });
  // Test builds must never be mistaken for deployable site output.
  await rm("dist", { recursive: true, force: true });
  await rm("public/pagefind", { recursive: true, force: true });
}

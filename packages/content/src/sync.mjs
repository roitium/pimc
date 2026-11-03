import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { buildGitEnvironment } from "./git-auth.mjs";

/** Stage a complete vault before replacing the mirror; never publish it as public/. */
export async function syncContents({
  root,
  gitUrl = process.env.VAULT_GIT_URL,
  gitRef = process.env.VAULT_GIT_REF,
  localPath = process.env.VAULT_PATH,
  env = process.env,
}) {
  const destination = join(root, "contents");
  if (!gitUrl && !localPath)
    throw new Error(
      "请通过环境变量配置 VAULT_GIT_URL，或用 VAULT_PATH 指定本地 pimc-vault。",
    );
  if (localPath && !gitUrl) {
    localPath = resolve(root, localPath);
    if (
      !relative(destination, localPath).startsWith("..") ||
      !relative(localPath, root).startsWith("..")
    )
      throw new Error(
        "VAULT_PATH 不能包含 workspace，也不能位于 contents 内。",
      );
  }
  const staging = mkdtempSync(join(root, ".contents-sync-"));
  const incoming = join(staging, "incoming");
  const previous = join(staging, "previous");
  try {
    if (gitUrl) {
      try {
        await promisify(execFile)(
          "git",
          [
            "clone",
            "--depth",
            "1",
            "--single-branch",
            ...(gitRef ? ["--branch", gitRef] : []),
            "--",
            gitUrl,
            incoming,
          ],
          { env: buildGitEnvironment(gitUrl, env), timeout: 120000 },
        );
      } catch {
        throw new Error(
          "vault 拉取失败，请检查 VAULT_GIT_URL、VAULT_GIT_TOKEN、仓库权限和网络。",
        );
      }
      rmSync(join(incoming, ".git"), { recursive: true, force: true });
    } else {
      cpSync(localPath, incoming, {
        recursive: true,
        filter: (file) => ![".git", ".DS_Store"].includes(basename(file)),
      });
    }
    for (const folder of [
      "personal-blog/posts",
      "lab-blog/posts",
      "lab-blog/pages",
    ])
      if (!existsSync(join(incoming, folder)))
        throw new Error(`vault 结构无效，缺少 ${folder}；原 contents 已保留。`);
    if (existsSync(destination)) renameSync(destination, previous);
    try {
      renameSync(incoming, destination);
    } catch (error) {
      if (existsSync(previous)) renameSync(previous, destination);
      throw error;
    }
    // Keep the directory in Git without committing private content.
    mkdirSync(destination, { recursive: true });
    writeFileSync(join(destination, ".gitkeep"), "");
    return destination;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

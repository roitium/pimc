import { z } from "zod";
export { z } from "zod";

// Explicit time zones avoid interpreting the same note differently across builds.
const timestamp = z
  .union([z.date(), z.iso.datetime({ offset: true })])
  .pipe(z.coerce.date());

export const postFields = {
  id: z.uuid(),
  title: z.string().min(1),
  publish_to: z
    .array(z.enum(["lab", "personal"]))
    .refine(
      (targets) => new Set(targets).size === targets.length,
      "publish_to 不允许重复的发布目标。",
    )
    .default([]),
  date: timestamp,
  updated_at: timestamp.nullable().default(null),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  pinned: z.boolean().default(false),
  password: z.string().min(1).nullable().default(null),
};

export function validatePublication(
  data: { publish_to: ("lab" | "personal")[]; password: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.publish_to.includes("lab") && data.password) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message:
        "发布到 lab 的文章不允许设置 password，请移除密码或取消 lab 发布目标。",
    });
  }
}

export const postSchema = z
  .looseObject(postFields)
  .superRefine(validatePublication);

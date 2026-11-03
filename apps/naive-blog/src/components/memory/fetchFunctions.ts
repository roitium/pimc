import { toast } from "sonner";
import { createHtmlProcessor } from "@pimc/content/render";
import { remarkTagToJsx } from "@/mdx-plugins/remark-tag-to-jsx";
import type { ApiMemo, ApiResponse, TimelineResponse } from "@/types/memos";

// Preserve the existing trusted HTML behavior for Memos only.
const memoProcessor = createHtmlProcessor({
  remarkPlugins: [remarkTagToJsx],
  allowHtml: true,
  sanitize: false,
});

const endpoint = (
  import.meta.env.PUBLIC_MEMOS_ENDPOINT || "https://v2.be.nodal.roitium.com"
).replace(/\/$/, "");

export async function fetchComments(memoName: string) {
  const response = await fetch(`${endpoint}/api/v1/memos/${memoName}`);
  const jsonResp: ApiResponse<ApiMemo> = await response.json();
  if (jsonResp.data === null) {
    toast.error("获取评论失败");
    return [];
  }
  const comments = jsonResp.data.replies;

  // 处理评论内容
  return await Promise.all(
    comments.map(async (comment) => {
      comment.content = await memoProcessor
        .process(comment.content)
        .then((file) => file.toString());
      return comment;
    }),
  );
}

/**
 * 获取Memos列表
 * @returns Memos列表
 */
export async function fetchMemos() {
  const response = await fetch(
    `${endpoint}/api/v1/memos/timeline?limit=20&username=roitium`, // 前端掩耳盗铃行为，有点难绷了
  );
  if (!response.ok) {
    toast.error("获取 memos 时发生错误！");
    return false;
  }
  const jsonResp: ApiResponse<TimelineResponse> = await response.json();
  if (jsonResp.data === null) {
    toast.error("获取 memos 时发生错误！");
    return false;
  }
  // 处理Memos内容
  return await Promise.all(
    jsonResp.data.data.map(async (memo: ApiMemo) => {
      memo.content = await memoProcessor
        .process(memo.content)
        .then((file) => file.toString());
      return memo;
    }),
  );
}

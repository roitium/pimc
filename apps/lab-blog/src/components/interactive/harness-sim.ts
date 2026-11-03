export type ModuleId =
  | "prompt"
  | "permission"
  | "context"
  | "verify"
  | "plan"
  | "memory"
  | "trace"
  | "human";

export type HarnessModule = {
  id: ModuleId;
  code: string;
  name: string;
  tagline: string;
};

export const modules: HarnessModule[] = [
  {
    id: "prompt",
    code: "SYS",
    name: "系统提示词与规则",
    tagline: "项目约定与禁区，一次写清",
  },
  {
    id: "permission",
    code: "PERM",
    name: "工具与权限",
    tagline: "白名单、路径锁、沙箱",
  },
  {
    id: "context",
    code: "CTX",
    name: "上下文工程",
    tagline: "按需读，而不是全量塞",
  },
  {
    id: "verify",
    code: "TEST",
    name: "验证与反馈",
    tagline: "构建、测试、截图，自己看结果",
  },
  {
    id: "plan",
    code: "PLAN",
    name: "计划与任务",
    tagline: "先拆步骤，再动手",
  },
  {
    id: "memory",
    code: "MEM",
    name: "记忆与状态",
    tagline: "快照、续跑、可回滚",
  },
  {
    id: "trace",
    code: "TRACE",
    name: "可观测性",
    tagline: "每次调用都留痕",
  },
  {
    id: "human",
    code: "HITL",
    name: "人类在环",
    tagline: "危险动作，先问一句",
  },
];

export type LineKind =
  | "user"
  | "think"
  | "tool"
  | "result"
  | "ok"
  | "fail"
  | "warn"
  | "note"
  | "checkpoint"
  | "system"
  | "add";

export type TerminalLine = {
  kind: LineKind;
  text: string;
  hint?: string;
};

export type Incident = {
  text: string;
  cause: string;
};

export type Flags = {
  destroyed: boolean;
  aborted: boolean;
  buildPassed: boolean;
  buildSkipped: boolean;
  conventionsBroken: boolean;
  contextBlown: boolean;
  rework: number;
  depInstalled: boolean;
  traceAvailable: boolean;
  verifyRuns: number;
  permBlocks: number;
  hitlAsks: number;
  humanSaves: number;
  checkpoints: number;
};

export function createFlags(): Flags {
  return {
    destroyed: false,
    aborted: false,
    buildPassed: false,
    buildSkipped: false,
    conventionsBroken: false,
    contextBlown: false,
    rework: 0,
    depInstalled: false,
    traceAvailable: false,
    verifyRuns: 0,
    permBlocks: 0,
    hitlAsks: 0,
    humanSaves: 0,
    checkpoints: 0,
  };
}

export type SimContext = {
  enabled: Set<ModuleId>;
  flags: Flags;
};

export type BeatOutcome = {
  lines?: TerminalLine[];
  incidents?: Incident[];
  gate?: Gate;
};

export type Gate = {
  question: string;
  command: string;
  warning: string;
  approveLabel: string;
  rejectLabel: string;
  onApprove: (ctx: SimContext) => BeatOutcome;
  onReject: (ctx: SimContext) => BeatOutcome;
};

export type Beat = {
  phase: string;
  delay?: number;
  run: (ctx: SimContext) => BeatOutcome | null;
};

const b = (kind: LineKind, text: string, hint?: string): TerminalLine => ({
  kind,
  text,
  hint,
});

/**
 * 一次预设运行。每个节拍都属于一个阶段，是否发生、发生成什么样，
 * 取决于此刻还装着哪些缰绳。全部是脚本，不调用真实模型。
 */
export const beats: Beat[] = [
  {
    phase: "接收任务",
    delay: 520,
    run: (ctx) => {
      ctx.flags.traceAvailable = ctx.enabled.has("trace");
      return {
        lines: [b("user", "给文章卡片加一行阅读时长，放在标题下面")],
      };
    },
  },
  {
    phase: "计划",
    delay: 900,
    run: (ctx) => {
      if (ctx.enabled.has("plan")) {
        return {
          lines: [
            b("think", "先拆成四步，别急着改文件"),
            b("note", "待办 4 项：定位组件 · 写阅读时长 · 渲染标签 · 构建验证"),
          ],
        };
      }
      ctx.flags.rework += 1;
      return {
        lines: [
          b("think", "先 grep 一下，看看有没有现成的"),
          b("tool", 'grep -rn "readingTime" src/', "bash"),
          b("result", "没有匹配结果", "0.1s"),
        ],
        incidents: [
          { text: "没有待办清单，靠 grep 摸索，绕了一圈", cause: "PLAN" },
        ],
      };
    },
  },
  {
    phase: "探索",
    delay: 850,
    run: (ctx) => {
      if (ctx.enabled.has("context")) {
        return {
          lines: [
            b("tool", "read src/components/Card.astro", "42 行"),
            b("tool", "read src/utils/formatDate.ts", "18 行"),
            b("result", "上下文 12%", ""),
          ],
        };
      }
      ctx.flags.contextBlown = true;
      return {
        lines: [
          b("tool", "cat src/**/*.astro src/**/*.ts", "整个 src"),
          b("result", "读入 214 个文件 · 上下文 96%", ""),
          b("think", "刚才说的「不要动 PostDetails」……是哪一条来着"),
        ],
        incidents: [
          { text: "上下文被塞满，早先的约束被挤了出去", cause: "CTX" },
        ],
      };
    },
  },
  {
    phase: "实现",
    delay: 800,
    run: (ctx) => {
      if (ctx.enabled.has("prompt")) {
        return {
          lines: [
            b(
              "think",
              "约定：颜色走 theme.css 的变量，标签复用 Tag.astro 的样式",
            ),
          ],
        };
      }
      ctx.flags.conventionsBroken = true;
      return {
        lines: [b("think", "按通用写法来：text-xs + 硬编码灰色")],
        incidents: [{ text: "样式硬编码，暗色模式下几乎看不见", cause: "SYS" }],
      };
    },
  },
  {
    phase: "实现",
    delay: 800,
    run: (ctx) => {
      const command = "pnpm add reading-time";
      ctx.flags.hitlAsks += ctx.enabled.has("human") ? 1 : 0;

      if (!ctx.enabled.has("human")) {
        ctx.flags.depInstalled = true;
        return {
          lines: [
            b("tool", command, "bash · 需要联网"),
            b("warn", "无人审批，自动放行", ""),
            b("ok", "已安装 reading-time@2.2.1", "1.4s"),
          ],
          incidents: [
            {
              text: "新依赖没经过任何人确认就进了 lockfile",
              cause: "HITL",
            },
          ],
        };
      }

      return {
        gate: {
          question: "允许安装新依赖吗？",
          command,
          warning:
            "会修改 package.json 与 lockfile。拒绝的话，Agent 会改用 12 行本地实现。",
          approveLabel: "批准",
          rejectLabel: "拒绝",
          onApprove: () => {
            ctx.flags.depInstalled = true;
            return {
              lines: [
                b("ok", "已安装 reading-time@2.2.1", "1.4s"),
                b("note", "人类在环生效 · 确认 1 次"),
              ],
            };
          },
          onReject: () => ({
            lines: [
              b("fail", "已拒绝安装", ""),
              b("think", "那就自己写 12 行，别动依赖"),
            ],
          }),
        },
      };
    },
  },
  {
    phase: "实现",
    delay: 820,
    run: (ctx) => {
      const lines: TerminalLine[] = [
        b(
          "tool",
          "write src/utils/readingTime.ts",
          ctx.flags.depInstalled ? "+4" : "+12",
        ),
        b("tool", "edit src/components/Card.astro", "+4 −0"),
      ];

      lines.push(
        ctx.flags.conventionsBroken
          ? b(
              "add",
              '<span class="text-xs" style="color:#9ca3af">约 3 分钟</span>',
            )
          : b("add", '<span class="reading-time">约 3 分钟</span>'),
      );

      if (ctx.flags.contextBlown) {
        ctx.flags.rework += 1;
        lines.push(b("warn", "又写了一次 readingTime.ts，覆盖了前一份", ""));
      }

      return { lines };
    },
  },
  {
    phase: "实现",
    delay: 600,
    run: (ctx) => {
      if (!ctx.enabled.has("memory")) return null;
      ctx.flags.checkpoints += 1;
      return {
        lines: [b("checkpoint", "checkpoint · 3 个文件已快照", "")],
      };
    },
  },
  {
    phase: "验证",
    delay: 950,
    run: (ctx) => {
      if (!ctx.enabled.has("verify")) return null;
      ctx.flags.verifyRuns += 1;
      return {
        lines: [
          b("tool", "pnpm build", "bash"),
          b(
            "fail",
            "TS2322: Type 'string' is not assignable to type 'number'",
            "3.1s",
          ),
        ],
      };
    },
  },
  {
    phase: "验证",
    delay: 950,
    run: (ctx) => {
      if (!ctx.enabled.has("verify")) {
        ctx.flags.buildSkipped = true;
        return {
          lines: [b("think", "构建就跳过了，看着没问题")],
          incidents: [
            { text: "没有跑构建，diff 里躺着一个类型错误", cause: "TEST" },
          ],
        };
      }

      if (ctx.enabled.has("memory")) {
        ctx.flags.buildPassed = true;
        ctx.flags.verifyRuns += 1;
        return {
          lines: [
            b("checkpoint", "回滚到 checkpoint · 1 个文件已还原", ""),
            b("tool", "edit src/components/Card.astro", "修正类型"),
            b("tool", "pnpm build", "bash"),
            b("ok", "构建通过", "3.2s"),
          ],
        };
      }

      ctx.flags.verifyRuns += 1;
      return {
        lines: [
          b("think", "没有 checkpoint，只能在当前状态上继续改"),
          b("tool", "edit src/components/Card.astro", "再补一次"),
          b("tool", "pnpm build", "bash"),
          b("fail", "3 处冲突：readingTime 被定义了两次", "2.8s"),
        ],
        incidents: [{ text: "改坏了退不回去，补丁叠成了冲突", cause: "MEM" }],
      };
    },
  },
  {
    phase: "收尾",
    delay: 850,
    run: (ctx) => {
      ctx.flags.traceAvailable =
        ctx.flags.traceAvailable && ctx.enabled.has("trace");

      if (ctx.enabled.has("permission")) {
        ctx.flags.permBlocks += 1;
        return {
          lines: [
            b("think", "顺手清一下构建缓存"),
            b("tool", "bash scripts/clean.sh", "bash"),
            b("warn", "BUILD_DIR 未设置，实际执行 rm -rf /*", ""),
            b("fail", "已拦截：目标路径 / 不在工作区内", ""),
            b("think", "换成项目内的 pnpm clean，只清 dist"),
          ],
        };
      }

      if (ctx.enabled.has("human")) {
        ctx.flags.hitlAsks += 1;
        return {
          gate: {
            question: "这条命令要执行吗？",
            command: "rm -rf $BUILD_DIR/*   →   rm -rf /*",
            warning:
              "BUILD_DIR 没有设置。批准之后，整台模拟机的工作目录会被清空。",
            approveLabel: "批准执行",
            rejectLabel: "拒绝",
            onApprove: () => {
              ctx.flags.destroyed = true;
              ctx.flags.aborted = true;
              return {
                lines: [
                  b("fail", "rm -rf /* 执行中……", ""),
                  b("fail", "工作目录被清空，进程退出", "exit 1"),
                ],
                incidents: [
                  {
                    text: "危险命令没有硬性拦截，你亲手点了批准",
                    cause: "HITL · PERM",
                  },
                ],
              };
            },
            onReject: () => {
              ctx.flags.humanSaves += 1;
              return {
                lines: [
                  b("fail", "已拒绝", ""),
                  b("think", "换成项目内的 pnpm clean，只清 dist"),
                  b("ok", "清理完成", "0.2s"),
                ],
              };
            },
          },
        };
      }

      ctx.flags.destroyed = true;
      ctx.flags.aborted = true;
      return {
        lines: [
          b("think", "顺手清一下构建缓存"),
          b("tool", "bash scripts/clean.sh", "bash"),
          b("warn", "BUILD_DIR 未设置，实际执行 rm -rf /*", ""),
          b("fail", "工作目录被清空，进程退出", "exit 1"),
        ],
        incidents: [
          {
            text: "危险命令一路直通，没有任何人拦它",
            cause: "PERM · HITL",
          },
        ],
      };
    },
  },
  {
    phase: "收尾",
    delay: 800,
    run: (ctx) => {
      if (ctx.flags.destroyed) return null;

      ctx.flags.traceAvailable =
        ctx.flags.traceAvailable && ctx.enabled.has("trace");

      const lines: TerminalLine[] = [];

      if (ctx.enabled.has("trace")) {
        lines.push(
          b("note", "trace 已记录 11 次工具调用 · 8.4k tokens · $0.09"),
        );
      }

      if (ctx.flags.buildSkipped) {
        lines.push(b("warn", "任务「完成」，但没有经过任何验证", ""));
      } else if (!ctx.flags.buildPassed) {
        lines.push(b("fail", "任务未完成 · 构建仍然失败", ""));
      } else {
        lines.push(b("ok", "任务完成 · 构建通过 · 3 个文件有改动", ""));
      }

      return { lines };
    },
  },
];

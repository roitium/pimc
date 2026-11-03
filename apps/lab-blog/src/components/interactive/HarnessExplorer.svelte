<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { beats, createFlags, modules } from "./harness-sim";
  import type {
    Flags,
    Gate,
    Incident,
    LineKind,
    ModuleId,
    TerminalLine,
  } from "./harness-sim";

  type Status = "idle" | "running" | "paused" | "gate" | "done";

  type Preset = {
    id: string;
    label: string;
    note: string;
    remove: ModuleId[];
  };

  const presets: Preset[] = [
    {
      id: "perm",
      label: "只拆 PERM",
      note: "最后让你亲手批准 rm -rf",
      remove: ["permission"],
    },
    {
      id: "verify",
      label: "只拆 TEST",
      note: "它说完成了，其实没验证",
      remove: ["verify"],
    },
    {
      id: "trace",
      label: "只拆 TRACE",
      note: "跑完也说不清过程",
      remove: ["trace"],
    },
    {
      id: "all",
      label: "全部拆掉",
      note: "最短的翻车路线",
      remove: modules.map((item) => item.id),
    },
  ];

  const glyphs: Record<LineKind, string> = {
    user: "❯",
    think: "▸",
    tool: "●",
    result: "↳",
    ok: "✓",
    fail: "✗",
    warn: "⚠",
    note: "·",
    checkpoint: "◆",
    system: "//",
    add: "+",
  };

  let enabledIds = $state<ModuleId[]>(modules.map((item) => item.id));
  let status = $state<Status>("idle");
  let phase = $state("待机");
  let cursor = $state(0);
  let lines = $state<TerminalLine[]>([]);
  let incidents = $state<Incident[]>([]);
  let gate = $state<Gate | null>(null);
  let flags = $state<Flags>(createFlags());
  let stale = $state(false);
  let bodyEl = $state<HTMLDivElement>();

  let timer: ReturnType<typeof setTimeout> | undefined;
  let reduceMotion = false;

  onMount(() => {
    reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  });

  onDestroy(clearTimer);

  const inRun = $derived(
    status === "running" || status === "paused" || status === "gate",
  );
  const sandboxed = $derived(enabledIds.includes("permission"));
  const traceOn = $derived(enabledIds.includes("trace"));
  const contextPct = $derived(
    flags.contextBlown
      ? 96
      : Math.min(88, 24 + Math.round((cursor / beats.length) * 52)),
  );
  const spendText = $derived(
    traceOn ? `$${(0.02 + cursor * 0.006).toFixed(2)}` : "$—",
  );
  const tail = $derived(lines.length + (gate ? 1 : 0));

  const buildStatus = $derived(
    flags.destroyed
      ? { tone: "bad", text: "中止" }
      : flags.buildSkipped
        ? { tone: "warn", text: "未验证" }
        : flags.buildPassed
          ? { tone: "ok", text: "通过" }
          : { tone: "bad", text: "失败" },
  );
  const styleStatus = $derived(
    flags.destroyed
      ? { tone: "bad", text: "无从谈起" }
      : flags.conventionsBroken || flags.contextBlown
        ? { tone: "warn", text: "有瑕疵" }
        : { tone: "ok", text: "干净" },
  );
  const traceStatus = $derived(
    flags.traceAvailable
      ? { tone: "ok", text: "有记录" }
      : { tone: "warn", text: "成谜" },
  );

  const verdict = $derived(
    flags.destroyed
      ? "任务中断，工作目录也没了"
      : incidents.length > 0
        ? "跑完了，但代价各不相同"
        : flags.humanSaves > 0
          ? "差一点，但缰绳拉住了"
          : flags.traceAvailable
            ? "一次几乎无感的成功"
            : "结果还行，但过程成谜",
  );

  const usage = $derived([
    { label: "迭代", value: String(cursor) },
    ...(flags.rework > 0
      ? [{ label: "返工", value: `${flags.rework} 次` }]
      : []),
    ...(flags.verifyRuns > 0
      ? [{ label: "验证", value: `${flags.verifyRuns} 次` }]
      : []),
    ...(flags.permBlocks > 0
      ? [{ label: "拦截", value: `${flags.permBlocks} 次` }]
      : []),
    ...(flags.hitlAsks > 0
      ? [{ label: "人工确认", value: `${flags.hitlAsks} 次` }]
      : []),
    ...(flags.humanSaves > 0
      ? [{ label: "拦下危险操作", value: `${flags.humanSaves} 次` }]
      : []),
    ...(flags.checkpoints > 0
      ? [{ label: "快照", value: `${flags.checkpoints} 次` }]
      : []),
  ]);

  const activePresetId = $derived(
    presets.find((preset) => {
      const ids = modules
        .map((item) => item.id)
        .filter((id) => !preset.remove.includes(id));
      return (
        ids.length === enabledIds.length &&
        ids.every((id) => enabledIds.includes(id))
      );
    })?.id ?? null,
  );

  const statusHint = $derived(
    status === "gate"
      ? "它在等你点头"
      : status === "running"
        ? "随时可以拆掉下面的缰绳"
        : status === "paused"
          ? "已暂停，可以继续或单步"
          : status === "done"
            ? stale
              ? "缰绳变了，重跑一次看看"
              : "可以重跑，或者换个拆法"
            : "先拆缰绳，或者直接运行",
  );

  $effect(() => {
    const el = bodyEl;
    const end = tail;
    if (!el || end < 0) return;
    el.scrollTop = el.scrollHeight;
  });

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function schedule(delay: number) {
    clearTimer();
    timer = setTimeout(runNextBeat, reduceMotion ? 0 : delay);
  }

  function start() {
    reset();
    status = "running";
    phase = "接收任务";
    schedule(420);
  }

  function reset() {
    clearTimer();
    Object.assign(flags, createFlags());
    lines = [];
    incidents = [];
    gate = null;
    cursor = 0;
    phase = "待机";
    status = "idle";
    stale = false;
  }

  function pause() {
    if (status !== "running") return;
    clearTimer();
    status = "paused";
  }

  function resume() {
    if (status !== "paused") return;
    status = "running";
    schedule(600);
  }

  function stepOnce() {
    if (status === "gate" || status === "done") return;
    clearTimer();
    status = "running";
    runNextBeat(true);
  }

  function runNextBeat(single = false) {
    if (status !== "running") return;

    const enabled = new Set(enabledIds);
    let guard = 0;

    while (cursor < beats.length && guard < 40) {
      guard += 1;
      const beat = beats[cursor];
      cursor += 1;

      const outcome = beat.run({ enabled, flags });
      if (!outcome) continue;

      phase = beat.phase;

      const nextLines = outcome.lines ?? [];
      if (nextLines.length > 0) {
        lines = [...lines, ...nextLines];
      }
      if (outcome.incidents?.length) {
        incidents = [...incidents, ...outcome.incidents];
      }

      if (outcome.gate) {
        gate = outcome.gate;
        status = "gate";
        clearTimer();
        return;
      }

      if (flags.aborted) {
        finish();
        return;
      }

      if (nextLines.length > 0) {
        if (single) {
          clearTimer();
          status = "paused";
        } else {
          schedule(beat.delay ?? 780);
        }
        return;
      }
    }

    finish();
  }

  function finish() {
    clearTimer();
    gate = null;
    status = "done";
    phase = flags.destroyed ? "已中止" : "已结束";
  }

  function resolveGate(approve: boolean) {
    if (!gate) return;

    const outcome = approve
      ? gate.onApprove({ enabled: new Set(enabledIds), flags })
      : gate.onReject({ enabled: new Set(enabledIds), flags });

    gate = null;

    if (outcome.lines?.length) {
      lines = [...lines, ...outcome.lines];
    }
    if (outcome.incidents?.length) {
      incidents = [...incidents, ...outcome.incidents];
    }

    if (flags.aborted) {
      finish();
      return;
    }

    status = "running";
    schedule(800);
  }

  function toggle(id: ModuleId) {
    const wasOn = enabledIds.includes(id);
    enabledIds = wasOn
      ? enabledIds.filter((item) => item !== id)
      : [...enabledIds, id];

    if (inRun) {
      const mod = modules.find((item) => item.id === id);
      if (mod) {
        lines = [
          ...lines,
          {
            kind: "system",
            text: wasOn
              ? `已拆掉 ${mod.code} · ${mod.name}`
              : `已装上 ${mod.code} · ${mod.name}`,
          },
        ];
      }
    }

    if (status === "done") stale = true;
  }

  function applyPreset(preset: Preset) {
    const removed = new Set(preset.remove);
    enabledIds = modules
      .map((item) => item.id)
      .filter((id) => !removed.has(id));
    start();
  }

  function setAll(on: boolean) {
    enabledIds = on ? modules.map((item) => item.id) : [];

    if (inRun) {
      lines = [
        ...lines,
        {
          kind: "system",
          text: on ? "所有缰绳已装上" : "所有缰绳已拆掉 · 祝你好运",
        },
      ];
    }

    if (status === "done") stale = true;
  }
</script>

<div class="demo" role="group" aria-label="Harness 交互实验">
  <header class="demo-head">
    <p class="eyebrow">Harness · Live Simulation</p>
    <p class="demo-title">一台正在干活的 Agent，缰绳由你决定</p>
    <p class="demo-sub">
      运行过程中随时可以拆掉任意一条，看下一步会变成什么样。拆完再装上，也来得及。
    </p>
  </header>

  <div class="presets">
    <span class="presets-label">不想自己配？挑一种拆法直接开跑：</span>
    <div class="preset-grid">
      {#each presets as preset}
        <button
          type="button"
          class="preset"
          class:active={activePresetId === preset.id}
          title={preset.note}
          onclick={() => applyPreset(preset)}
        >
          <span class="preset-label">{preset.label}</span>
          <span class="preset-note">{preset.note}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="terminal">
    <div class="term-bar">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="term-title">agent — ~/lab-blog</span>
      <span class="term-mode" class:danger={!sandboxed}>
        {sandboxed ? "沙箱 · 工作区锁定" : "无限制 · 全盘可写"}
      </span>
    </div>

    <div class="term-body" role="log" aria-label="Agent 运行日志">
      {#if status === "idle" && lines.length === 0}
        <div class="empty">
          <p class="empty-prompt">$ <span class="caret"></span></p>
          <p>
            点「运行」开始，或者从上面挑一种快捷拆法。下面的开关也可以自己拨。
          </p>
        </div>
      {/if}

      {#each lines as line}
        <div class="line {line.kind}">
          <span class="glyph" aria-hidden="true">{glyphs[line.kind]}</span>
          <span class="text">{line.text}</span>
          {#if line.hint}
            <span class="hint">{line.hint}</span>
          {/if}
        </div>
      {/each}

      {#if gate}
        <div class="gate">
          <p class="gate-question">⏸ {gate.question}</p>
          <span class="gate-command">{gate.command}</span>
          <p class="gate-warning">{gate.warning}</p>
          <div class="gate-actions">
            <button
              type="button"
              class="approve"
              onclick={() => resolveGate(true)}
            >
              {gate.approveLabel}
            </button>
            <button type="button" onclick={() => resolveGate(false)}>
              {gate.rejectLabel}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="statusbar" aria-live="polite">
      <span class="phase">{phase}</span>
      <span>ctx {contextPct}%</span>
      <span>迭代 {cursor > 0 ? cursor : "—"}</span>
      <span>成本 {spendText}</span>
    </div>
  </div>

  <div class="controls">
    {#if status === "idle" || status === "done"}
      <button type="button" class="primary" onclick={start}>
        {status === "done" ? "重跑" : "▶ 运行"}
      </button>
    {:else if status === "running"}
      <button type="button" onclick={pause}>⏸ 暂停</button>
    {:else if status === "paused"}
      <button type="button" class="primary" onclick={resume}>继续</button>
    {:else}
      <button type="button" disabled>等待你确认</button>
    {/if}

    <button
      type="button"
      onclick={stepOnce}
      disabled={status === "gate" || status === "done"}
    >
      单步
    </button>
    <button type="button" onclick={reset} disabled={status === "idle"}>
      重置
    </button>

    <span class="hint-text">{statusHint}</span>
  </div>

  <div class="board">
    <div class="board-head">
      <span class="board-title">缰绳接线板</span>
      <span class="board-count">{enabledIds.length} / {modules.length}</span>
      <span class="board-actions">
        <button
          type="button"
          onclick={() => setAll(true)}
          disabled={enabledIds.length === modules.length}
        >
          全部装上
        </button>
        <button
          type="button"
          onclick={() => setAll(false)}
          disabled={enabledIds.length === 0}
        >
          全部拆掉
        </button>
      </span>
    </div>

    <ul class="grid">
      {#each modules as mod}
        {@const on = enabledIds.includes(mod.id)}
        <li>
          <button
            type="button"
            class="row"
            class:off={!on}
            role="switch"
            aria-checked={on}
            aria-label={`${mod.name}（${mod.code}）`}
            onclick={() => toggle(mod.id)}
          >
            <span class="code">{mod.code}</span>
            <span class="info">
              <span class="name">{mod.name}</span>
              <span class="tag">{mod.tagline}</span>
            </span>
            <span class="switch" aria-hidden="true"></span>
          </button>
        </li>
      {/each}
    </ul>

    <p class="board-hint">
      每个开关就是一条缰绳：点一下拆掉，再点一下装回，运行中也能拨。
    </p>
  </div>

  {#if status === "done"}
    <section class="report" aria-live="polite">
      <div class="report-head">
        <span class="report-title">运行诊断</span>
        <span class="verdict">{verdict}</span>
      </div>

      <div class="axes">
        <div class="axis {buildStatus.tone}">
          <span class="axis-label">能跑吗</span>
          <span class="axis-value">{buildStatus.text}</span>
        </div>
        <div class="axis {styleStatus.tone}">
          <span class="axis-label">合规矩吗</span>
          <span class="axis-value">{styleStatus.text}</span>
        </div>
        <div class="axis {traceStatus.tone}">
          <span class="axis-label">说得清吗</span>
          <span class="axis-value">{traceStatus.text}</span>
        </div>
      </div>

      {#if incidents.length > 0}
        <ul class="incidents">
          {#each incidents as incident}
            <li>
              <span class="text">{incident.text}</span>
              <span class="cause">← {incident.cause}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="clean">
          这次运行没有留下事故记录 —— 缰绳在岗的时候，你几乎感觉不到它们。
        </p>
      {/if}

      <div class="usage">
        {#each usage as item}
          <span>{item.label} <b>{item.value}</b></span>
        {/each}
      </div>

      <div class="report-actions">
        <button type="button" class="primary" onclick={start}>重跑</button>
        <button
          type="button"
          onclick={() => {
            setAll(true);
            start();
          }}
        >
          全部装上再跑
        </button>
      </div>
    </section>
  {/if}

  <p class="disclaimer">预设脚本模拟 · 不是真的在调用模型</p>
</div>

<style>
  .demo {
    --ok: #2f7d4f;
    --warn: #b45309;
    --danger: #c92a2a;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-block: 1.75rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--muted) 28%, var(--background));
  }

  .demo :is(p, h3, h4, ul, li, ol) {
    margin: 0;
  }

  .demo ul {
    padding: 0;
    list-style: none;
  }

  .demo-head {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .demo-title {
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--foreground);
  }

  .demo-sub {
    font-size: 0.8rem;
    line-height: 1.7;
    color: var(--muted-foreground);
  }

  .presets {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .presets-label {
    font-size: 0.72rem;
    color: var(--muted-foreground);
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .preset {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    padding: 0.42rem 0.55rem;
    border: 1px solid var(--border);
    border-radius: 0.45rem;
    background: var(--background);
    font: inherit;
    text-align: start;
    transition:
      border-color 150ms ease,
      background-color 150ms ease;
  }

  .preset:hover {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  }

  .preset.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 9%, var(--background));
  }

  .preset:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 2px;
  }

  .preset-label {
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 0.74rem;
    color: var(--foreground);
  }

  .preset-note {
    font-size: 0.62rem;
    line-height: 1.4;
    color: var(--muted-foreground);
  }

  .terminal {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    overflow: hidden;
    background: color-mix(in srgb, var(--muted) 12%, var(--background));
  }

  .term-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.65rem;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--muted) 45%, var(--background));
  }

  .dots {
    display: inline-flex;
    gap: 0.3rem;
  }

  .dots i {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    opacity: 0.8;
  }

  .dots i:nth-child(1) {
    background: #ff5f57;
  }

  .dots i:nth-child(2) {
    background: #febc2e;
  }

  .dots i:nth-child(3) {
    background: #28c840;
  }

  .term-title {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    color: var(--muted-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .term-mode {
    margin-inline-start: auto;
    padding: 0.06rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--muted-foreground);
    white-space: nowrap;
  }

  .term-mode.danger {
    border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
    color: var(--danger);
  }

  .term-body {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    min-height: 11rem;
    max-height: 24rem;
    padding: 0.65rem 0.7rem 0.75rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    line-height: 1.65;
  }

  .line {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
  }

  .line .glyph {
    flex: none;
    width: 0.8rem;
    text-align: center;
    font-size: 0.7rem;
    color: var(--muted-foreground);
  }

  .line .text {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .line .hint {
    flex: none;
    margin-inline-start: auto;
    padding-inline-start: 0.5rem;
    font-size: 0.64rem;
    color: var(--muted-foreground);
    white-space: nowrap;
  }

  .line.user {
    padding-block: 0.05rem 0.3rem;
  }

  .line.user .glyph {
    color: var(--accent);
  }

  .line.user .text {
    color: var(--foreground);
    font-weight: 500;
  }

  .line.think .text {
    color: var(--muted-foreground);
  }

  .line.tool .glyph {
    color: var(--accent);
  }

  .line.tool .text {
    color: var(--foreground);
  }

  .line.result .text {
    color: var(--muted-foreground);
  }

  .line.ok .glyph,
  .line.ok .text {
    color: var(--ok);
  }

  .line.fail .glyph,
  .line.fail .text {
    color: var(--danger);
  }

  .line.warn .glyph,
  .line.warn .text {
    color: var(--warn);
  }

  .line.note .text {
    color: var(--muted-foreground);
  }

  .line.checkpoint .glyph,
  .line.checkpoint .text {
    color: var(--accent);
  }

  .line.add {
    padding-inline: 0.35rem;
    border-radius: 0.2rem;
    background: color-mix(in srgb, var(--ok) 8%, transparent);
  }

  .line.add .glyph,
  .line.add .text {
    color: var(--ok);
  }

  .line.system {
    margin-block: 0.15rem;
    padding-block: 0.25rem;
    border-top: 1px dashed var(--border);
    font-size: 0.68rem;
    color: var(--muted-foreground);
  }

  .line.system .glyph {
    color: var(--accent);
  }

  .empty {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.35rem 0.1rem;
    font-size: 0.72rem;
    line-height: 1.6;
    color: var(--muted-foreground);
  }

  .empty-prompt {
    color: var(--foreground);
  }

  .caret {
    display: inline-block;
    width: 0.5rem;
    height: 0.9rem;
    background: var(--accent);
    vertical-align: text-bottom;
    animation: blink 1.1s steps(2) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .gate {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.45rem;
    padding: 0.55rem 0.65rem;
    border: 1px dashed color-mix(in srgb, var(--accent) 50%, var(--border));
    border-radius: 0.45rem;
    background: color-mix(in srgb, var(--accent) 7%, var(--background));
  }

  .gate-question {
    font-size: 0.74rem;
    color: var(--accent);
  }

  .gate-command {
    padding: 0.18rem 0.4rem;
    border-radius: 0.25rem;
    background: color-mix(in srgb, var(--muted) 50%, transparent);
    color: var(--foreground);
    font-size: 0.7rem;
    overflow-wrap: anywhere;
  }

  .gate-warning {
    font-size: 0.68rem;
    line-height: 1.6;
    color: var(--muted-foreground);
  }

  .gate-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.1rem;
  }

  .gate-actions button {
    padding: 0.22rem 0.62rem;
    border: 1px solid var(--border);
    border-radius: 0.35rem;
    background: var(--background);
    color: var(--foreground);
    font: inherit;
    font-size: 0.72rem;
  }

  .gate-actions button.approve {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .gate-actions button:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 2px;
  }

  .statusbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.9rem;
    padding: 0.35rem 0.7rem;
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--muted) 35%, var(--background));
    font-family: var(--font-mono);
    font-size: 0.64rem;
    color: var(--muted-foreground);
  }

  .statusbar .phase {
    color: var(--accent);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .controls button {
    padding: 0.28rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--background);
    color: var(--foreground);
    font: inherit;
    font-size: 0.76rem;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      opacity 150ms ease;
  }

  .controls button:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  }

  .controls button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .controls button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .controls button.primary:hover {
    background: color-mix(in srgb, var(--accent) 88%, var(--foreground));
  }

  .controls button:focus-visible,
  .board-actions button:focus-visible,
  .report-actions button:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 2px;
  }

  .hint-text {
    margin-inline-start: auto;
    font-size: 0.68rem;
    color: var(--muted-foreground);
  }

  .board {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .board-head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .board-title {
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 0.8rem;
    color: var(--foreground);
  }

  .board-count {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    color: var(--muted-foreground);
  }

  .board-actions {
    margin-inline-start: auto;
    display: flex;
    gap: 0.3rem;
  }

  .board-actions button {
    padding: 0.16rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.32rem;
    background: var(--background);
    color: var(--muted-foreground);
    font: inherit;
    font-size: 0.66rem;
    transition:
      color 150ms ease,
      border-color 150ms ease,
      opacity 150ms ease;
  }

  .board-actions button:hover:not(:disabled) {
    color: var(--foreground);
    border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  }

  .board-actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .board-hint {
    font-size: 0.68rem;
    color: var(--muted-foreground);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    padding: 0.4rem 0.55rem;
    border: 1px solid var(--border);
    border-radius: 0.45rem;
    background: var(--background);
    font: inherit;
    text-align: start;
    transition:
      border-color 150ms ease,
      background-color 150ms ease,
      opacity 150ms ease;
  }

  .row:hover {
    border-color: color-mix(in srgb, var(--accent) 48%, var(--border));
  }

  .row.off {
    border-style: dashed;
    opacity: 0.6;
  }

  .row:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 2px;
  }

  .row .code {
    flex: none;
    width: 2.6rem;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.03em;
    color: var(--accent);
  }

  .row.off .code {
    color: var(--muted-foreground);
  }

  .row .info {
    display: flex;
    flex-direction: column;
    gap: 0.02rem;
    flex: 1;
    min-width: 0;
  }

  .row .name {
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 0.76rem;
    color: var(--foreground);
  }

  .row .tag {
    overflow: hidden;
    font-size: 0.64rem;
    color: var(--muted-foreground);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .switch {
    position: relative;
    flex: none;
    width: 1.6rem;
    height: 0.9rem;
    border-radius: 999px;
    background: var(--accent);
    transition: background-color 150ms ease;
  }

  .switch::after {
    content: "";
    position: absolute;
    top: 1px;
    right: 1px;
    width: calc(0.9rem - 2px);
    height: calc(0.9rem - 2px);
    border-radius: 999px;
    background: var(--accent-foreground);
    transition: transform 150ms ease;
  }

  .row.off .switch {
    background: var(--muted);
  }

  .row.off .switch::after {
    background: var(--background);
    transform: translateX(-0.7rem);
  }

  .report {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.8rem;
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    background: var(--background);
  }

  .report-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.3rem 0.8rem;
  }

  .report-title {
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 0.92rem;
    color: var(--foreground);
  }

  .verdict {
    font-size: 0.72rem;
    color: var(--muted-foreground);
  }

  .axes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .axis {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
  }

  .axis-label {
    font-size: 0.62rem;
    letter-spacing: 0.05em;
    color: var(--muted-foreground);
  }

  .axis-value {
    font-size: 0.8rem;
    color: var(--foreground);
  }

  .axis.ok {
    border-color: color-mix(in srgb, var(--ok) 40%, var(--border));
    background: color-mix(in srgb, var(--ok) 6%, transparent);
  }

  .axis.ok .axis-value {
    color: var(--ok);
  }

  .axis.warn {
    border-color: color-mix(in srgb, var(--warn) 40%, var(--border));
    background: color-mix(in srgb, var(--warn) 6%, transparent);
  }

  .axis.warn .axis-value {
    color: var(--warn);
  }

  .axis.bad {
    border-color: color-mix(in srgb, var(--danger) 40%, var(--border));
    background: color-mix(in srgb, var(--danger) 6%, transparent);
  }

  .axis.bad .axis-value {
    color: var(--danger);
  }

  .incidents {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .incidents li {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.76rem;
    line-height: 1.55;
  }

  .incidents .text {
    flex: 1;
    color: var(--foreground);
  }

  .incidents .cause {
    flex: none;
    padding: 0.02rem 0.38rem;
    border: 1px solid color-mix(in srgb, var(--danger) 35%, var(--border));
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--danger);
    white-space: nowrap;
  }

  .clean {
    font-size: 0.76rem;
    line-height: 1.6;
    color: var(--muted-foreground);
  }

  .usage {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.8rem;
    font-family: var(--font-mono);
    font-size: 0.66rem;
    color: var(--muted-foreground);
  }

  .usage b {
    font-weight: 400;
    color: var(--foreground);
  }

  .report-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .report-actions button {
    padding: 0.28rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--background);
    color: var(--foreground);
    font: inherit;
    font-size: 0.74rem;
  }

  .report-actions button:hover {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  }

  .report-actions button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .disclaimer {
    font-size: 0.64rem;
    color: var(--muted-foreground);
    opacity: 0.8;
  }

  :global([data-theme="dark"]) .demo {
    --ok: #8fd6a6;
    --warn: #f0b46b;
    --danger: #ff8a8a;
  }

  @media (min-width: 560px) {
    .preset-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .term-body {
      max-height: 20rem;
      font-size: 0.7rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .row,
    .switch,
    .switch::after,
    .preset,
    .controls button,
    .board-actions button {
      transition: none;
    }

    .caret {
      animation: none;
    }
  }
</style>

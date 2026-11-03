<script lang="ts">
  type Actor = "request" | "model" | "local" | "answer";

  type Panel = {
    label: string;
    code: string;
  };

  type Step = {
    short: string;
    actor: Actor;
    title: string;
    note: string;
    panels?: Panel[];
    bubble?: string;
  };

  type Scenario = {
    id: string;
    label: string;
    question: string;
    steps: Step[];
  };

  const actorLabels: Record<Actor, string> = {
    request: "你的程序 → 模型",
    model: "模型 → 你的程序",
    local: "你的程序 · 真正执行",
    answer: "模型 → 用户",
  };

  const j = (value: unknown) => JSON.stringify(value, null, 2);

  const tools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "查询指定城市当前的天气",
        parameters: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "城市名，例如：北京",
            },
          },
          required: ["city"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "calculate",
        description: "计算一个数学表达式，支持 + - * / 和括号",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "要计算的表达式，例如：(1 + 2) * 3",
            },
          },
          required: ["expression"],
        },
      },
    },
  ];

  function requestStep(question: string): Step {
    return {
      short: "发请求",
      actor: "request",
      title: "你发出的不只有问题，还有工具清单",
      note: "每次请求都可以附带一份 tools 定义。它只是一段 JSON Schema，是给模型看的说明书，而不是会被执行的代码。",
      panels: [
        { label: "messages", code: j([{ role: "user", content: question }]) },
        { label: "tools（本次可用）", code: j(tools) },
      ],
    };
  }

  const weatherData = {
    city: "北京",
    temperature: "18°C",
    condition: "晴",
  };

  const scenarios: Scenario[] = [
    {
      id: "weather",
      label: "查天气",
      question: "北京今天天气怎么样？",
      steps: [
        requestStep("北京今天天气怎么样？"),
        {
          short: "要工具",
          actor: "model",
          title: "模型先不回答，而是「点菜」",
          note: "content 是 null，真正的意图藏在 tool_calls 里：调用哪个函数、参数是什么。注意 arguments 是一段 JSON 字符串，模型并不保证它一定合法，所以还得由你来解析和校验。",
          panels: [
            {
              label: "assistant message",
              code: j({
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_w1",
                    type: "function",
                    function: {
                      name: "get_weather",
                      arguments: JSON.stringify({ city: "北京" }),
                    },
                  },
                ],
              }),
            },
          ],
        },
        {
          short: "跑函数",
          actor: "local",
          title: "真正干活的是你的代码",
          note: "模型没有联网能力，它只产出了一个调用意图。解析参数、找到函数、真的把请求发出去，全部发生在你的进程里 —— 也正因如此，权限和校验应该卡在这一步。",
          panels: [
            {
              label: "你的代码",
              code: `const { city } = JSON.parse(call.function.arguments);\nconst data = await get_weather(city);`,
            },
            { label: "函数返回", code: j(weatherData) },
          ],
        },
        {
          short: "再回答",
          actor: "answer",
          title: "把结果塞回上下文，再问一次",
          note: "第二次请求里多了一条 role: tool 的消息，它通过 tool_call_id 与上一次调用对上号。模型这次终于「看到」了天气，于是生成最终回答。",
          panels: [
            {
              label: "追加到 messages",
              code: j({
                role: "tool",
                tool_call_id: "call_w1",
                content: JSON.stringify(weatherData),
              }),
            },
          ],
          bubble:
            "北京现在 18°C，天气晴朗、风也不大，挺适合出门。需要我看看晚些时候会不会降温吗？",
        },
      ],
    },
    {
      id: "math",
      label: "做算术",
      question: "帮我算一下 (37 × 21 + 8) ÷ 5 等于多少",
      steps: [
        requestStep("帮我算一下 (37 × 21 + 8) ÷ 5 等于多少"),
        {
          short: "要工具",
          actor: "model",
          title: "模型把应用题翻译成函数调用",
          note: "它甚至顺手把 × 和 ÷ 换成了 * 和 /。这一步的价值在于：算术交给计算器，模型只负责理解你想算什么。",
          panels: [
            {
              label: "assistant message",
              code: j({
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_c1",
                    type: "function",
                    function: {
                      name: "calculate",
                      arguments: JSON.stringify({
                        expression: "(37 * 21 + 8) / 5",
                      }),
                    },
                  },
                ],
              }),
            },
          ],
        },
        {
          short: "跑函数",
          actor: "local",
          title: "你只提供了一个表达式求值函数",
          note: "函数本身可以简单到只有几行。模型的「能力」边界，其实取决于你递给它的工具边界。",
          panels: [
            {
              label: "你的代码",
              code: `const { expression } = JSON.parse(call.function.arguments);\nconst value = calculate(expression);`,
            },
            {
              label: "函数返回",
              code: j({ expression: "(37 * 21 + 8) / 5", value: 157 }),
            },
          ],
        },
        {
          short: "再回答",
          actor: "answer",
          title: "结果回到上下文，模型负责解释",
          note: "工具负责算得准，模型负责说得像人话。一次完整的 Function Calling，就是「模型决策 + 本地执行」的接力。",
          panels: [
            {
              label: "追加到 messages",
              code: j({
                role: "tool",
                tool_call_id: "call_c1",
                content: JSON.stringify({
                  expression: "(37 * 21 + 8) / 5",
                  value: 157,
                }),
              }),
            },
          ],
          bubble: "(37 × 21 + 8) ÷ 5 = 157，正好整除，没有小数。",
        },
      ],
    },
    {
      id: "chat",
      label: "闲聊",
      question: "你好呀，简单介绍一下你自己",
      steps: [
        requestStep("你好呀，简单介绍一下你自己"),
        {
          short: "直接回答",
          actor: "answer",
          title: "这一次，模型选择不用工具",
          note: "回复里没有 tool_calls，循环到此结束。用不用工具是模型的判断，而不是你在代码里写死的 if —— 你只负责把工具摆出来。",
          bubble:
            "我是运行在这段代码里的一个语言模型：没有记忆，也不能上网，只能根据你给的消息预测下一个 token。需要查天气或算数时，我才会请求调用你提供的工具。",
        },
      ],
    },
  ];

  let scenarioId = $state("weather");
  let index = $state(0);
  let playing = $state(false);

  const scenario = $derived(
    scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
  );
  const steps = $derived(scenario.steps);
  const step = $derived(steps[Math.min(index, steps.length - 1)]);
  const atEnd = $derived(index >= steps.length - 1);

  $effect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (index < steps.length - 1) index += 1;
      else playing = false;
    }, 1600);
    return () => clearTimeout(timer);
  });

  function pick(id: string) {
    scenarioId = id;
    index = 0;
    playing = false;
  }

  function jump(target: number) {
    playing = false;
    index = target;
  }

  function next() {
    playing = false;
    if (atEnd) index = 0;
    else index += 1;
  }

  function prev() {
    playing = false;
    index = Math.max(0, index - 1);
  }

  function togglePlay() {
    if (playing) {
      playing = false;
      return;
    }
    if (atEnd) index = 0;
    playing = true;
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // 极简 JSON 着色器：字符串、数字、true/false/null 分别上色
  function highlight(source: string) {
    let out = "";
    let i = 0;

    while (i < source.length) {
      const char = source[i];

      if (char === '"') {
        let end = i + 1;
        while (end < source.length) {
          if (source[end] === "\\") {
            end += 2;
            continue;
          }
          if (source[end] === '"') break;
          end += 1;
        }
        const text = escapeHtml(source.slice(i, end + 1));
        let cursor = end + 1;
        while (cursor < source.length && source[cursor] === " ") cursor += 1;
        out +=
          source[cursor] === ":"
            ? `<span class="tok-key">${text}</span>`
            : `<span class="tok-str">${text}</span>`;
        i = end + 1;
        continue;
      }

      if (/[-\d]/.test(char)) {
        const match = /^-?\d+(?:\.\d+)?/.exec(source.slice(i));
        if (match) {
          out += `<span class="tok-num">${match[0]}</span>`;
          i += match[0].length;
          continue;
        }
      }

      const keyword = /^(true|false|null)\b/.exec(source.slice(i));
      if (keyword) {
        out += `<span class="tok-kw">${keyword[0]}</span>`;
        i += keyword[0].length;
        continue;
      }

      out += escapeHtml(char);
      i += 1;
    }

    return out;
  }
</script>

<div class="demo" role="group" aria-label="Function Calling 交互演示">
  <header class="demo-head">
    <p class="eyebrow">Function Calling</p>
    <p class="demo-title">它不是魔法，只是一次约定好的往返</p>
    <p class="demo-sub">选一个问题，跟着下面几步走完一次真正的工具调用。</p>
  </header>

  <div class="chips" role="group" aria-label="选择示例问题">
    {#each scenarios as item}
      <button
        type="button"
        class:active={scenarioId === item.id}
        aria-pressed={scenarioId === item.id}
        onclick={() => pick(item.id)}
      >
        {item.label}
      </button>
    {/each}
  </div>

  <div class="question">
    <span class="who">用户</span>
    <p>{scenario.question}</p>
  </div>

  <ol class="track" aria-label="调用步骤">
    {#each steps as item, i}
      <li>
        <button
          type="button"
          class:active={i === index}
          class:done={i < index}
          aria-current={i === index ? "step" : undefined}
          onclick={() => jump(i)}
        >
          <span class="num">{i + 1}</span>
          <span class="short">{item.short}</span>
        </button>
      </li>
    {/each}
  </ol>

  <section class="card" aria-live="polite">
    <div class="step-head">
      <span class="actor {step.actor}">{actorLabels[step.actor]}</span>
      <h3>{step.title}</h3>
    </div>

    {#if step.panels}
      <div class="panels">
        {#each step.panels as panel}
          <div class="panel">
            <span class="panel-label">{panel.label}</span>
            <pre><code>{@html highlight(panel.code)}</code></pre>
          </div>
        {/each}
      </div>
    {/if}

    {#if step.bubble}
      <div class="bubble">
        <span class="bubble-label">助手</span>
        <p>{step.bubble}</p>
      </div>
    {/if}

    <p class="note">{step.note}</p>
  </section>

  <div class="controls">
    <button type="button" class="ghost" disabled={index === 0} onclick={prev}>
      上一步
    </button>
    <button type="button" class="primary" onclick={next}>
      {atEnd ? "重播" : "下一步"}
    </button>
    <button type="button" class="ghost" onclick={togglePlay}>
      {playing ? "暂停" : "自动演示"}
    </button>
    <span class="count">{index + 1} / {steps.length}</span>
  </div>
</div>

<style>
  .demo {
    --violet: #6d4aff;
    --green: #2f7d4f;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-block: 1.75rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--muted) 28%, var(--background));
  }

  .demo :is(p, h3, ul, li, ol) {
    margin: 0;
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
    color: var(--muted-foreground);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chips button {
    padding: 0.28rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--background);
    color: var(--muted-foreground);
    font: inherit;
    font-size: 0.8rem;
    transition:
      background-color 150ms ease,
      color 150ms ease,
      border-color 150ms ease;
  }

  .chips button:hover {
    color: var(--foreground);
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
  }

  .chips button.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--background));
    color: var(--accent);
  }

  .chips button:focus-visible,
  .track button:focus-visible,
  .controls button:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 2px;
  }

  .question {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
    font-size: 0.88rem;
  }

  .question .who {
    flex: none;
    padding: 0.05rem 0.4rem;
    border-radius: 0.3rem;
    background: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--muted-foreground);
  }

  .question p {
    color: var(--foreground);
  }

  .track {
    display: flex;
    gap: 0.4rem;
    padding: 0;
    list-style: none;
    overflow-x: auto;
  }

  .track li {
    flex: 1 0 auto;
  }

  .track button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.3rem 0.55rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
    color: var(--muted-foreground);
    font: inherit;
    font-size: 0.78rem;
    transition:
      border-color 150ms ease,
      color 150ms ease,
      background-color 150ms ease;
  }

  .track button:hover {
    color: var(--foreground);
  }

  .track button.done {
    color: var(--foreground);
    border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  }

  .track button.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, var(--background));
    color: var(--foreground);
  }

  .num {
    display: grid;
    place-items: center;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 999px;
    background: var(--muted);
    color: var(--muted-foreground);
    font-family: var(--font-mono);
    font-size: 0.66rem;
  }

  .track button.active .num {
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .track button.done .num {
    background: color-mix(in srgb, var(--accent) 25%, var(--muted));
    color: var(--foreground);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.85rem;
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    background: var(--background);
  }

  .step-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .step-head h3 {
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 0.98rem;
    font-weight: 500;
    line-height: 1.5;
    color: var(--foreground);
  }

  .actor {
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.02em;
    color: var(--muted-foreground);
  }

  .actor.request {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
  }

  .actor.model {
    border-color: color-mix(in srgb, var(--violet) 40%, transparent);
    background: color-mix(in srgb, var(--violet) 10%, transparent);
    color: var(--violet);
  }

  .actor.local {
    border-color: color-mix(in srgb, var(--green) 40%, transparent);
    background: color-mix(in srgb, var(--green) 10%, transparent);
    color: var(--green);
  }

  .actor.answer {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
  }

  .panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: 0.5rem;
  }

  .panel {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    overflow: hidden;
    background: color-mix(in srgb, var(--muted) 14%, var(--background));
  }

  .panel-label {
    display: block;
    padding: 0.28rem 0.55rem;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--muted) 45%, transparent);
    font-family: var(--font-mono);
    font-size: 0.66rem;
    color: var(--muted-foreground);
  }

  .panel pre {
    max-height: 16rem;
    margin: 0;
    padding: 0.55rem 0.65rem;
    overflow: auto;
    background: transparent;
    border: 0;
    border-radius: 0;
    font-size: 0.72rem;
    line-height: 1.6;
    tab-size: 2;
  }

  .panel code {
    padding: 0;
    background: transparent;
    color: var(--foreground);
    font-family: var(--font-mono);
    font-size: inherit;
    white-space: pre;
    overflow-wrap: normal;
  }

  .panel :global(.tok-key) {
    color: var(--accent);
  }

  .panel :global(.tok-str) {
    color: var(--green);
  }

  .panel :global(.tok-num) {
    color: #b45309;
  }

  .panel :global(.tok-kw) {
    color: var(--violet);
  }

  .bubble {
    position: relative;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border);
    border-inline-start: 3px solid var(--accent);
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--accent) 5%, var(--background));
    font-size: 0.88rem;
    line-height: 1.7;
    color: var(--foreground);
  }

  .bubble-label {
    display: block;
    margin-bottom: 0.15rem;
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.06em;
    color: var(--accent);
  }

  .note {
    font-size: 0.8rem;
    line-height: 1.7;
    color: var(--muted-foreground);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
  }

  .controls button {
    padding: 0.32rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 0.45rem;
    background: var(--background);
    color: var(--foreground);
    font: inherit;
    font-size: 0.8rem;
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

  .count {
    margin-inline-start: auto;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted-foreground);
  }

  :global([data-theme="dark"]) .demo {
    --violet: #b49bff;
    --green: #8fd6a6;
  }

  :global([data-theme="dark"]) .panel :global(.tok-num) {
    color: #f0b46b;
  }

  @media (prefers-reduced-motion: reduce) {
    .chips button,
    .track button,
    .controls button {
      transition: none;
    }
  }
</style>

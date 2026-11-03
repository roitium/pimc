<script lang="ts">
  type Endian = "big" | "little";

  let { initial = "big" }: { initial?: Endian } = $props();

  const BASE_ADDRESS = 0x1000;

  let endian = $state<Endian>(initial);
  let hex = $state("12345678");

  // 输入不足 8 位时左补 0，按 uint32_t 解释
  const value = $derived(parseInt(hex.padStart(8, "0"), 16) >>> 0);

  const bytes = $derived(
    endian === "big"
      ? [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff)
      : [0, 8, 16, 24].map((shift) => (value >>> shift) & 0xff),
  );

  const byteText = $derived(
    bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, "0")),
  );

  const msbIndex = $derived(endian === "big" ? 0 : 3);
  const lsbIndex = $derived(endian === "big" ? 3 : 0);

  function handleInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    hex = input.value
      .replace(/[^0-9a-fA-F]/g, "")
      .slice(0, 8)
      .toUpperCase();
    input.value = hex;
  }

  function address(index: number) {
    return `0x${(BASE_ADDRESS + index).toString(16).toUpperCase()}`;
  }
</script>

<div class="demo" role="group" aria-label="字节序内存布局演示">
  <div class="demo-head">
    <div>
      <p class="demo-title">内存布局演示</p>
      <p class="demo-sub">改数值或切换字节序，看 4 个字节如何落进内存</p>
    </div>

    <div class="field">
      <label for="endianness-value">uint32_t</label>
      <div class="input-wrap">
        <span class="prefix" aria-hidden="true">0x</span>
        <input
          id="endianness-value"
          value={hex}
          maxlength="8"
          inputmode="text"
          spellcheck="false"
          autocomplete="off"
          aria-describedby="endianness-hint"
          oninput={handleInput}
        />
      </div>
    </div>
  </div>

  <div class="switch" role="group" aria-label="选择字节序">
    <button
      type="button"
      class:active={endian === "big"}
      aria-pressed={endian === "big"}
      onclick={() => (endian = "big")}
    >
      大端序
    </button>
    <button
      type="button"
      class:active={endian === "little"}
      aria-pressed={endian === "little"}
      onclick={() => (endian = "little")}
    >
      小端序
    </button>
  </div>

  <div class="direction" aria-hidden="true">
    <span>低地址</span>
    <span class="line"></span>
    <span>高地址</span>
  </div>

  <ol class="memory" aria-label="内存地址从低到高">
    {#each bytes as _, index}
      <li
        class="cell"
        class:msb={index === msbIndex}
        class:lsb={index === lsbIndex}
      >
        <span class="addr">{address(index)}</span>
        <span class="byte">{byteText[index]}</span>
        <span class="tag">
          {#if index === msbIndex}
            MSB
          {:else if index === lsbIndex}
            LSB
          {:else}
            &nbsp;
          {/if}
        </span>
      </li>
    {/each}
  </ol>

  <p class="reading">
    从低地址到高地址读出：
    <code>{byteText.join(" ")}</code>
  </p>

  <p class="note" id="endianness-hint">
    {#if endian === "big"}
      最高有效字节（MSB）放在最低地址，和书写顺序一致，所以网络协议用大端。
    {:else}
      最低有效字节（LSB）放在最低地址，x86 和大部分 ARM 默认都是小端。
    {/if}
  </p>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    margin-block: 1.75rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--muted) 28%, var(--background));
  }

  .demo-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem 1.5rem;
  }

  .demo-title {
    margin: 0;
    font-family: "LXGW WenKai Medium", var(--font-app, sans-serif);
    font-size: 1rem;
    font-weight: 500;
    color: var(--foreground);
  }

  .demo-sub {
    margin: 0.15rem 0 0;
    font-size: 0.8rem;
    color: var(--muted-foreground);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field label {
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted-foreground);
  }

  .input-wrap {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.3rem 0.55rem;
    border: 1px solid var(--border);
    border-radius: 0.45rem;
    background: var(--background);
    font-family: var(--font-mono);
    font-size: 0.95rem;
  }

  .input-wrap:focus-within {
    border-color: var(--accent);
    outline: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
    outline-offset: 1px;
  }

  .prefix {
    color: var(--muted-foreground);
  }

  input {
    width: 8.5ch;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--foreground);
    font: inherit;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    outline: none;
  }

  .switch {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.2rem;
    border: 1px solid var(--border);
    border-radius: 0.55rem;
    background: var(--background);
  }

  .switch button {
    padding: 0.3rem 0.85rem;
    border: 0;
    border-radius: 0.4rem;
    background: transparent;
    color: var(--muted-foreground);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    transition:
      background-color 150ms ease,
      color 150ms ease;
  }

  .switch button:hover {
    color: var(--foreground);
  }

  .switch button.active {
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .switch button:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 2px;
  }

  .direction {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--muted-foreground);
  }

  .direction .line {
    position: relative;
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .direction .line::after {
    content: "";
    position: absolute;
    inset-inline-end: 0;
    top: 50%;
    width: 0.4rem;
    height: 0.4rem;
    border-top: 1px solid var(--border);
    border-inline-end: 1px solid var(--border);
    transform: translateY(-50%) rotate(45deg);
  }

  .memory {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.55rem 0.4rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
    transition: border-color 150ms ease;
  }

  .cell.msb {
    border-color: var(--accent);
  }

  .addr {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--muted-foreground);
  }

  .byte {
    font-family: var(--font-mono);
    font-size: 1.35rem;
    line-height: 1.2;
    color: var(--foreground);
  }

  .tag {
    min-height: 1em;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.06em;
    color: var(--muted-foreground);
  }

  .cell.msb .tag {
    color: var(--accent);
  }

  .reading {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted-foreground);
  }

  .reading code {
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
    background: var(--muted);
    color: var(--foreground);
    font-family: var(--font-mono);
  }

  .note {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.6;
    color: var(--muted-foreground);
  }

  @media (max-width: 480px) {
    .memory {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .cell:nth-child(2) .addr,
    .cell:nth-child(4) .addr {
      font-size: 0.68rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .switch button,
    .cell {
      transition: none;
    }
  }
</style>

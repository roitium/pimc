export function observeScrollControls(onChange: (visible: boolean) => void) {
  const position = () =>
    Math.max(
      0,
      Math.min(
        window.scrollY,
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    );
  let previous = position();
  let frame = 0;
  onChange(previous > 0);

  const update = () => {
    frame = 0;
    const current = position();
    if (current <= 0) onChange(false);
    else if (Math.abs(current - previous) >= 2) onChange(current < previous);
    previous = current;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
  };
}

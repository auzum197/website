const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const
const CELL =
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel")
  ) || 3
const DURATION = 240

function attach(host: HTMLElement): void {
  const canvas = host.querySelector<HTMLCanvasElement>("canvas[data-dither]")
  const color = host.dataset.color
  const ctx = canvas?.getContext("2d")
  if (!canvas || !color || !ctx) return

  const glow = (percent: number): string =>
    `color-mix(in oklch, ${color} ${percent}%, transparent)`
  canvas.style.filter = `drop-shadow(0 0 2px ${glow(70)}) drop-shadow(0 0 10px ${glow(45)})`

  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  let cols = 0
  let rows = 0
  let progress = 0
  let target = 0
  let last = 0
  let phase = 0
  let running = false

  const draw = (): void => {
    ctx.clearRect(0, 0, cols, rows)
    if (progress <= 0) return
    const eased = 1 - (1 - progress) ** 3
    ctx.fillStyle = color
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const wave =
          0.1 * Math.sin(x * 0.11 + y * 0.155 - phase * 1.6) +
          0.06 * Math.sin(y * 0.085 + phase * 1.1)
        const density =
          (1.1 * (x / cols) + 0.75 * (1 - y / rows) - 1.05 + wave) * eased
        const threshold = ((BAYER[(y & 3) * 4 + (x & 3)] ?? 0) + 0.5) / 16
        if (density > threshold) ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  const tick = (now: number): void => {
    const dt = now - last
    last = now
    if (!reduced.matches) phase += dt / 1000
    const step = reduced.matches ? 1 : dt / DURATION
    progress =
      target > progress
        ? Math.min(target, progress + step)
        : Math.max(target, progress - step)
    draw()
    if (progress === target && (target === 0 || reduced.matches)) {
      running = false
      return
    }
    requestAnimationFrame(tick)
  }

  const go = (next: number): void => {
    target = next
    host.toggleAttribute("data-lit", next === 1)
    if (running) return
    running = true
    last = performance.now()
    requestAnimationFrame(tick)
  }

  const resize = (): void => {
    const rect = host.getBoundingClientRect()
    cols = Math.ceil(rect.width / CELL)
    rows = Math.ceil(rect.height / CELL)
    canvas.width = cols
    canvas.height = rows
    canvas.style.width = `${cols * CELL}px`
    canvas.style.height = `${rows * CELL}px`
    draw()
  }

  new ResizeObserver(resize).observe(host)
  host.addEventListener("pointerenter", () => go(1))
  host.addEventListener("pointerleave", () => go(0))
  host.addEventListener("focusin", () => go(1))
  host.addEventListener("focusout", () => go(0))
}

document.querySelectorAll<HTMLElement>("[data-dither-host]").forEach(attach)

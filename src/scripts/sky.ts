const reduced = matchMedia("(prefers-reduced-motion: reduce)")

function attach(host: HTMLElement): void {
  const layer = host.querySelector<HTMLElement>("[data-sky-layer]")
  const video = layer?.querySelector<HTMLVideoElement>("video")
  if (!layer || !video) return

  const set = (on: boolean): void => {
    layer.toggleAttribute("data-on", on)
    host.toggleAttribute("data-lit", on)
    if (!on) {
      video.pause()
      return
    }
    if (video.readyState > 0) video.currentTime = 0
    if (!reduced.matches) void video.play().catch(() => undefined)
  }

  host.addEventListener("pointerenter", () => set(true))
  host.addEventListener("pointerleave", () => set(false))
  host.addEventListener("focusin", () => set(true))
  host.addEventListener("focusout", () => set(false))
}

document.querySelectorAll<HTMLElement>("[data-sky-host]").forEach(attach)

export {}

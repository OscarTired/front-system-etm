import { useRef, useEffect } from "react"

const RENDER_SCALE = 4

export function OceanDither() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let w = 0, h = 0
    let rw = 0, rh = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const off = document.createElement("canvas")
    const offCtx = off.getContext("2d")
    if (!offCtx) return
    let imgData: ImageData | null = null
    let pixels: Uint8ClampedArray | null = null

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      rw = Math.max(1, Math.ceil(w / RENDER_SCALE))
      rh = Math.max(1, Math.ceil(h / RENDER_SCALE))
      off.width = rw
      off.height = rh
      imgData = offCtx.createImageData(rw, rh)
      pixels = imgData.data
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const mouse = { x: 0, y: 0, inside: false, strength: 0 }
    const parent = canvas.parentElement!
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - r.left) / RENDER_SCALE
      mouse.y = (e.clientY - r.top) / RENDER_SCALE
      mouse.inside = true
    }
    const onLeave = () => { mouse.inside = false }
    parent.addEventListener("mousemove", onMove)
    parent.addEventListener("mouseleave", onLeave)

    const bayer4 = [
      0, 8, 2, 10,
      12, 4, 14, 6,
      3, 11, 1, 9,
      15, 7, 13, 5,
    ].map(v => (v + 0.5) / 16)

    let t0 = 0

    const surfaceY = (px: number, tm: number): number => {
      let y = rh * 0.38
        + Math.sin(px * 0.011 + tm * 0.9) * 4
        + Math.sin(px * 0.027 - tm * 1.5) * 2.2
        + Math.sin(px * 0.061 + tm * 2.3) * 1
      if (mouse.strength > 0.001) {
        const dx = px - mouse.x
        const sigma = 22
        const bell = Math.exp(-(dx * dx) / (2 * sigma * sigma))
        y += bell * 3.5 * mouse.strength
        y += bell * 2.5 * mouse.strength * Math.sin(tm * 4 - Math.abs(dx) * 0.03)
      }
      return y
    }

    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      h /= 360; s /= 100; l /= 100
      if (s === 0) return [l * 255, l * 255, l * 255]
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      const hue2rgb = (t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      return [hue2rgb(h + 1 / 3) * 255, hue2rgb(h) * 255, hue2rgb(h - 1 / 3) * 255]
    }

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw)
      if (document.hidden) return
      if (time - t0 < 50) return
      t0 = time
      if (!imgData || !pixels) return

      mouse.strength += ((mouse.inside ? 1 : 0) - mouse.strength) * 0.08

      const tm = time * 0.001
      pixels.fill(0)

      for (let cx = 0; cx < rw; cx++) {
        const surf = surfaceY(cx, tm)
        const rowStart = Math.max(0, Math.floor(surf - 2))
        const bayerCol = cx % 4

        for (let cy = rowStart; cy < rh; cy++) {
          const depth = cy - surf
          const bayerVal = bayer4[(cy % 4) * 4 + bayerCol]

          let boost = 0
          if (mouse.strength > 0.001) {
            const mdx = cx - mouse.x
            const mdy = cy - mouse.y
            boost = Math.exp(-(mdx * mdx + mdy * mdy) / (2 * 32 * 32)) * mouse.strength
          }

          let r: number, g: number, b: number

          if (depth < 0) {
            if (depth < -3) continue
            const foamThreshold = 0.12 + boost * 0.55
            if (bayerVal > foamThreshold) continue
            ;[r, g, b] = hslToRgb(190, 80, 78 + boost * 15)
          } else {
            const depthFrac = Math.min(1, depth / (rh * 0.55))
            const shimmer = Math.sin(cx * 0.045 + cy * 0.07 - tm * 1.8) * 0.08
            const density = 0.18 + depthFrac * 0.82 + shimmer
            if (bayerVal > density) continue
            const hue = 188 + depthFrac * 20
            const sat = 75 - depthFrac * 10
            const light = 70 - depthFrac * 42 + boost * 22
            ;[r, g, b] = hslToRgb(hue, sat, light)
          }

          const idx = (cy * rw + cx) * 4
          pixels[idx] = r
          pixels[idx + 1] = g
          pixels[idx + 2] = b
          pixels[idx + 3] = 255
        }
      }

      offCtx.putImageData(imgData, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, w, h)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      parent.removeEventListener("mousemove", onMove)
      parent.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.16 }}
    />
  )
}

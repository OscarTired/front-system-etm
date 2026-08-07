import type { ViewState } from "../../types/types"

/** Paso de cuadrícula en mm que se ve ~24–48 px en pantalla. */
function niceGridStep(scale: number): number {
  const targetPx = 32
  const raw = targetPx / Math.max(scale, 1e-9)
  const exp = Math.floor(Math.log10(raw))
  const base = Math.pow(10, exp)
  const frac = raw / base
  let mult = 1
  if (frac > 5) mult = 10
  else if (frac > 2) mult = 5
  else if (frac > 1) mult = 2
  return mult * base
}

/**
 * Dibuja la cuadrícula en coords mundo (caller ya aplicó translate/rotate/scale).
 * Tiene en cuenta rotationDeg para cubrir TODO el viewport visible (crítico en
 * tablet con plancha landscape → vista rotada 90°).
 * Limita cantidad de celdas para no explotar en móvil al hacer zoom out.
 */
export function drawWorldGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewState,
  canvasW: number,
  canvasH: number,
  scale: number,
  style: "dots" | "lines" | "cross",
) {
  const { offsetX, offsetY, rotationDeg = 0 } = view
  const inv = 1 / Math.max(scale, 1e-12)

  // 4 esquinas del canvas CSS → coords mundo (inversa de localToScreen)
  const corners: { x: number; y: number }[] = []
  for (const [sx, sy] of [
    [0, 0],
    [canvasW, 0],
    [0, canvasH],
    [canvasW, canvasH],
  ] as const) {
    let cx = sx - canvasW / 2 - offsetX
    let cy = sy - canvasH / 2 - offsetY
    if (rotationDeg === 90) {
      // inversa de rotate(π/2): (x,y) → (y, -x)
      const ix = cy
      const iy = -cx
      cx = ix
      cy = iy
    }
    corners.push({ x: cx * inv, y: cy * inv })
  }

  let worldLeft = corners[0].x
  let worldRight = corners[0].x
  let worldTop = corners[0].y
  let worldBottom = corners[0].y
  for (const c of corners) {
    if (c.x < worldLeft) worldLeft = c.x
    if (c.x > worldRight) worldRight = c.x
    if (c.y < worldTop) worldTop = c.y
    if (c.y > worldBottom) worldBottom = c.y
  }

  // Paso adaptativo + tope de celdas (móvil/zoom-out no debe generar 50k dots)
  const MAX_CELLS = 80
  let step = niceGridStep(scale)
  const spanX = Math.max(1e-6, worldRight - worldLeft)
  const spanY = Math.max(1e-6, worldBottom - worldTop)
  if (spanX / step > MAX_CELLS) step = spanX / MAX_CELLS
  if (spanY / step > MAX_CELLS) step = Math.max(step, spanY / MAX_CELLS)

  const pad = step
  const x0 = Math.floor((worldLeft - pad) / step) * step
  const y0 = Math.floor((worldTop - pad) / step) * step
  const x1 = worldRight + pad
  const y1 = worldBottom + pad
  const majorEvery = 5

  ctx.save()
  ctx.lineCap = "butt"

  if (style === "lines" || style === "cross") {
    for (let x = x0; x <= x1; x += step) {
      const major = Math.abs(Math.round(x / step)) % majorEvery === 0
      ctx.strokeStyle = major ? "#3a3a42" : "#252528"
      ctx.lineWidth = (major ? 1 : 0.6) / scale
      ctx.beginPath()
      ctx.moveTo(x, y0)
      ctx.lineTo(x, y1)
      ctx.stroke()
    }
    for (let y = y0; y <= y1; y += step) {
      const major = Math.abs(Math.round(y / step)) % majorEvery === 0
      ctx.strokeStyle = major ? "#3a3a42" : "#252528"
      ctx.lineWidth = (major ? 1 : 0.6) / scale
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(x1, y)
      ctx.stroke()
    }
  }

  if (style === "dots" || style === "cross") {
    // ~1.25 px en pantalla; fillRect es mucho más barato que arc()×N en móvil
    const r = 1.25 / scale
    const d = r * 2
    ctx.fillStyle = "#3a3a3f"
    for (let x = x0; x <= x1; x += step) {
      for (let y = y0; y <= y1; y += step) {
        ctx.fillRect(x - r, y - r, d, d)
      }
    }
  }

  ctx.restore()
}
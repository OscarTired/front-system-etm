import { toScreen, MEASURE_COLOR, type ViewTransform } from "./geometry"

export interface Measurement {
  id: number
  points: [number, number][]
  distance: number
}

export const MEASURE_SELECTED_COLOR = "#f59e0b"
export const MEASURE_HOVER_COLOR = "#4ade80"

export function distToSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

export function distanceToMeasurement(m: Measurement, wx: number, wy: number): number {
  let d = Infinity
  for (let i = 0; i < m.points.length - 1; i++) {
    d = Math.min(d, distToSegment(wx, wy, m.points[i][0], m.points[i][1], m.points[i + 1][0], m.points[i + 1][1]))
  }
  for (const p of m.points) d = Math.min(d, Math.hypot(wx - p[0], wy - p[1]))
  return d
}

interface DrawMeasurementOptions {
  selected?: boolean
  hovered?: boolean
  dashed?: boolean
}

export function drawMeasurement(
  ctx: CanvasRenderingContext2D,
  m: Measurement,
  t: ViewTransform,
  opts: DrawMeasurementOptions = {},
) {
  const color = opts.selected ? MEASURE_SELECTED_COLOR : opts.hovered ? MEASURE_HOVER_COLOR : MEASURE_COLOR

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = opts.selected ? 2.2 : 1.5
  if (opts.dashed) ctx.setLineDash([4, 4])

  ctx.beginPath()
  for (let i = 0; i < m.points.length; i++) {
    const [sx, sy] = toScreen(m.points[i][0], m.points[i][1], t)
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy)
  }
  ctx.stroke()
  ctx.setLineDash([])

  for (const p of m.points) {
    const [sx, sy] = toScreen(p[0], p[1], t)
    ctx.fillStyle = "#ffffff"
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.fillRect(sx - 3, sy - 3, 6, 6)
    ctx.strokeRect(sx - 3, sy - 3, 6, 6)
  }

  if (m.points.length === 2) {
    const dist = m.distance
    const [sx1, sy1] = toScreen(m.points[0][0], m.points[0][1], t)
    const [sx2, sy2] = toScreen(m.points[1][0], m.points[1][1], t)
    const mx = (sx1 + sx2) / 2, my = (sy1 + sy2) / 2
    const label = `${dist.toFixed(2)}mm`
    ctx.font = "11px sans-serif"
    const tw = ctx.measureText(label).width
    ctx.fillStyle = "rgba(255,255,255,0.95)"
    ctx.fillRect(mx - tw / 2 - 5, my - 19, tw + 10, 16)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.strokeRect(mx - tw / 2 - 5, my - 19, tw + 10, 16)
    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.fillText(label, mx, my - 7)
  }
  ctx.restore()
}

export function drawMeasurementInfo(
  ctx: CanvasRenderingContext2D,
  p1: [number, number],
  p2: [number, number],
  t: ViewTransform,
) {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  const label = `ΔX ${dx.toFixed(1)} · ΔY ${dy.toFixed(1)} · ∠ ${angle.toFixed(1)}°`

  const [sx1, sy1] = toScreen(p1[0], p1[1], t)
  const [sx2, sy2] = toScreen(p2[0], p2[1], t)
  const mx = (sx1 + sx2) / 2
  const my = (sy1 + sy2) / 2

  ctx.save()
  ctx.font = "10px sans-serif"
  const tw = ctx.measureText(label).width
  ctx.fillStyle = "rgba(255,255,255,0.92)"
  ctx.strokeStyle = "#d4d4d4"
  ctx.lineWidth = 1
  ctx.fillRect(mx - tw / 2 - 6, my + 3, tw + 12, 16)
  ctx.strokeRect(mx - tw / 2 - 6, my + 3, tw + 12, 16)
  ctx.fillStyle = "#525252"
  ctx.textAlign = "center"
  ctx.fillText(label, mx, my + 15)
  ctx.restore()
}

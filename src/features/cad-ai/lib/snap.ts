import type { Entity } from "../types"
import { toScreen, type ViewTransform } from "./geometry"

export type SnapType = "endpoint" | "midpoint" | "center" | "edge"

export interface SnapResult {
  point: [number, number]
  type: SnapType
  label: string
}

const SNAP_PRIORITY: Record<SnapType, number> = {
  endpoint: 0,
  midpoint: 1,
  center: 2,
  edge: 3,
}

const SNAP_LABELS: Record<SnapType, string> = {
  endpoint: "extremo",
  midpoint: "punto medio",
  center: "centro",
  edge: "borde",
}

export function getEntitySnapPoints(e: Entity): { point: [number, number]; type: SnapType }[] {
  const mid = (a: [number, number], b: [number, number]): [number, number] =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  switch (e.type) {
    case "line":
    case "fold":
    case "dimension":
      return [
        { point: e.start, type: "endpoint" },
        { point: e.end, type: "endpoint" },
        { point: mid(e.start, e.end), type: "midpoint" },
      ]
    case "circle": {
      const [cx, cy] = e.center
      return [
        { point: e.center, type: "center" },
        { point: [cx + e.radius, cy], type: "endpoint" },
        { point: [cx - e.radius, cy], type: "endpoint" },
        { point: [cx, cy + e.radius], type: "endpoint" },
        { point: [cx, cy - e.radius], type: "endpoint" },
      ]
    }
    case "arc": {
      const sa = (e.startAngle * Math.PI) / 180
      const ea = (e.endAngle * Math.PI) / 180
      return [
        { point: e.center, type: "center" },
        { point: [e.center[0] + e.radius * Math.cos(sa), e.center[1] + e.radius * Math.sin(sa)], type: "endpoint" },
        { point: [e.center[0] + e.radius * Math.cos(ea), e.center[1] + e.radius * Math.sin(ea)], type: "endpoint" },
      ]
    }
    case "polyline": {
      const pts: { point: [number, number]; type: SnapType }[] = []
      for (const p of e.points) pts.push({ point: p, type: "endpoint" })
      for (let i = 0; i < e.points.length - 1; i++) {
        pts.push({ point: mid(e.points[i], e.points[i + 1]), type: "midpoint" })
      }
      return pts
    }
    case "rectangle": {
      const c: [number, number][] = [
        [e.x, e.y],
        [e.x + e.width, e.y],
        [e.x + e.width, e.y + e.height],
        [e.x, e.y + e.height],
      ]
      return [
        ...c.map(p => ({ point: p, type: "endpoint" as SnapType })),
        ...c.map((p, i) => ({ point: mid(p, c[(i + 1) % 4]), type: "midpoint" as SnapType })),
      ]
    }
    case "slot": {
      const rad = (e.angle * Math.PI) / 180
      const dx = (e.length / 2) * Math.cos(rad)
      const dy = (e.length / 2) * Math.sin(rad)
      return [
        { point: e.center, type: "center" },
        { point: [e.center[0] + dx, e.center[1] + dy], type: "endpoint" },
        { point: [e.center[0] - dx, e.center[1] - dy], type: "endpoint" },
      ]
    }
    case "ellipse":
      return [{ point: e.center, type: "center" }]
    case "text":
      return [{ point: e.position, type: "endpoint" }]
    default:
      return []
  }
}

function nearestPointOnEntity(e: Entity, wx: number, wy: number): [number, number] | null {
  const projectToSegment = (a: [number, number], b: [number, number]): [number, number] => {
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len2 = dx * dx + dy * dy
    if (len2 === 0) return a
    let t = ((wx - a[0]) * dx + (wy - a[1]) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    return [a[0] + t * dx, a[1] + t * dy]
  }

  switch (e.type) {
    case "line":
    case "fold":
    case "dimension":
      return projectToSegment(e.start, e.end)
    case "polyline": {
      let best: [number, number] | null = null
      let bestD = Infinity
      for (let i = 0; i < e.points.length - 1; i++) {
        const p = projectToSegment(e.points[i], e.points[i + 1])
        const d = Math.hypot(wx - p[0], wy - p[1])
        if (d < bestD) { bestD = d; best = p }
      }
      return best
    }
    case "rectangle": {
      const c: [number, number][] = [
        [e.x, e.y],
        [e.x + e.width, e.y],
        [e.x + e.width, e.y + e.height],
        [e.x, e.y + e.height],
      ]
      let best: [number, number] | null = null
      let bestD = Infinity
      for (let i = 0; i < 4; i++) {
        const p = projectToSegment(c[i], c[(i + 1) % 4])
        const d = Math.hypot(wx - p[0], wy - p[1])
        if (d < bestD) { bestD = d; best = p }
      }
      return best
    }
    case "circle": {
      const dx = wx - e.center[0], dy = wy - e.center[1]
      const d = Math.hypot(dx, dy)
      if (d === 0) return null
      return [e.center[0] + (dx / d) * e.radius, e.center[1] + (dy / d) * e.radius]
    }
    default:
      return null
  }
}

export function findSnap(wx: number, wy: number, entities: Entity[], threshold: number): SnapResult | null {
  let best: SnapResult | null = null
  let bestRank = Infinity
  let bestDist = Infinity

  for (const e of entities) {
    for (const sp of getEntitySnapPoints(e)) {
      const d = Math.hypot(wx - sp.point[0], wy - sp.point[1])
      const rank = SNAP_PRIORITY[sp.type]
      if (d <= threshold && (rank < bestRank || (rank === bestRank && d < bestDist))) {
        best = { point: sp.point, type: sp.type, label: SNAP_LABELS[sp.type] }
        bestRank = rank
        bestDist = d
      }
    }
  }
  if (best) return best

  for (const e of entities) {
    const p = nearestPointOnEntity(e, wx, wy)
    if (!p) continue
    const d = Math.hypot(wx - p[0], wy - p[1])
    if (d <= threshold && d < bestDist) {
      best = { point: p, type: "edge", label: SNAP_LABELS.edge }
      bestDist = d
    }
  }
  return best
}

export function constrainTo45(
  start: [number, number],
  p: [number, number],
): { point: [number, number]; angleDeg: number } {
  const dx = p[0] - start[0], dy = p[1] - start[1]
  const dist = Math.hypot(dx, dy)
  if (dist === 0) return { point: p, angleDeg: 0 }
  const step = Math.PI / 4
  const angle = Math.round(Math.atan2(dy, dx) / step) * step
  return {
    point: [start[0] + dist * Math.cos(angle), start[1] + dist * Math.sin(angle)],
    angleDeg: (angle * 180) / Math.PI,
  }
}

export function constrainToAxis(
  start: [number, number],
  p: [number, number],
  toleranceDeg = 2.5,
): { point: [number, number]; angleDeg: number } | null {
  const dx = p[0] - start[0], dy = p[1] - start[1]
  if (dx === 0 && dy === 0) return null
  const angleDeg = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI) % 90
  const tol = Math.min(toleranceDeg, 45)
  if (angleDeg <= tol) return { point: [p[0], start[1]], angleDeg: 0 }
  if (90 - angleDeg <= tol) return { point: [start[0], p[1]], angleDeg: 90 }
  return null
}

export function drawAngleGuide(
  ctx: CanvasRenderingContext2D,
  start: [number, number],
  angleDeg: number,
  w: number,
  h: number,
  t: ViewTransform,
) {
  const rad = (angleDeg * Math.PI) / 180
  const len = ((w + h) * 2) / t.scale
  const a = toScreen(start[0] - Math.cos(rad) * len, start[1] - Math.sin(rad) * len, t)
  const b = toScreen(start[0] + Math.cos(rad) * len, start[1] + Math.sin(rad) * len, t)
  ctx.save()
  ctx.strokeStyle = "#06b6d4"
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke()
  ctx.restore()
}

export function drawSnapIndicator(ctx: CanvasRenderingContext2D, snap: SnapResult, t: ViewTransform) {
  const [sx, sy] = toScreen(snap.point[0], snap.point[1], t)
  const size = 4.5

  ctx.save()
  ctx.fillStyle = "#f97316"
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  switch (snap.type) {
    case "endpoint":
      ctx.rect(sx - size, sy - size, size * 2, size * 2)
      break
    case "midpoint":
      ctx.moveTo(sx, sy - size - 1)
      ctx.lineTo(sx + size + 1, sy + size)
      ctx.lineTo(sx - size - 1, sy + size)
      ctx.closePath()
      break
    case "center":
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      break
    case "edge":
      ctx.moveTo(sx, sy - size - 1)
      ctx.lineTo(sx + size + 1, sy)
      ctx.lineTo(sx, sy + size + 1)
      ctx.lineTo(sx - size - 1, sy)
      ctx.closePath()
      break
  }
  ctx.fill()
  ctx.stroke()

  ctx.font = "10px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  const label = snap.label
  const tw = ctx.measureText(label).width
  ctx.fillStyle = "rgba(255,255,255,0.92)"
  ctx.fillRect(sx - tw / 2 - 4, sy - size - 20, tw + 8, 14)
  ctx.fillStyle = "#ea580c"
  ctx.fillText(label, sx, sy - size - 9)
  ctx.restore()
}

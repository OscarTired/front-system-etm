import type { Entity, PlanGeometry, Tool } from "../types"

export interface ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export const LAYER_COLORS: Record<string, string> = {
  CUT: "#dc2626",
  ETCH: "#2563eb",
  FOLD: "#7c3aed",
  TEXT: "#6b7280",
  DIM: "#9ca3af",
  "0": "#1a1a1a",
}

export const SELECTED_COLOR = "#0ea5e9"
export const AI_SELECT_COLOR = "#f97316"
export const MEASURE_COLOR = "#16a34a"

export function getEntityColor(entity: Entity): string {
  return LAYER_COLORS[entity.layer || "0"] || "#1a1a1a"
}

export function toScreen(x: number, y: number, t: ViewTransform): [number, number] {
  return [x * t.scale + t.offsetX, -y * t.scale + t.offsetY]
}

export function fromScreen(sx: number, sy: number, t: ViewTransform): [number, number] {
  return [(sx - t.offsetX) / t.scale, -(sy - t.offsetY) / t.scale]
}

export function getEntityBounds(e: Entity): [number, number][] {
  switch (e.type) {
    case "line": return [e.start, e.end]
    case "circle": return [[e.center[0] - e.radius, e.center[1] - e.radius], [e.center[0] + e.radius, e.center[1] + e.radius]]
    case "arc": return [[e.center[0] - e.radius, e.center[1] - e.radius], [e.center[0] + e.radius, e.center[1] + e.radius]]
    case "polyline": return e.points
    case "rectangle": return [[e.x, e.y], [e.x + e.width, e.y + e.height]]
    case "slot": {
      const halfLen = e.length / 2 + e.width / 2
      return [[e.center[0] - halfLen, e.center[1] - halfLen], [e.center[0] + halfLen, e.center[1] + halfLen]]
    }
    case "ellipse": {
      const r = Math.max(e.radiusX, e.radiusY)
      return [[e.center[0] - r, e.center[1] - r], [e.center[0] + r, e.center[1] + r]]
    }
    case "fold": return [e.start, e.end]
    case "text": return [e.position]
    case "dimension": return [e.start, e.end]
    default: return []
  }
}

export function getEntityCenter(e: Entity): [number, number] {
  const pts = getEntityBounds(e)
  if (pts.length === 0) return [0, 0]
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2]
}

export function entityArea(e: Entity): number {
  const pts = getEntityBounds(e)
  if (pts.length === 0) return Infinity
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  return (maxX - minX) * (maxY - minY)
}

export function moveEntity(e: Entity, dx: number, dy: number): Entity {
  switch (e.type) {
    case "line": return { ...e, start: [e.start[0] + dx, e.start[1] + dy], end: [e.end[0] + dx, e.end[1] + dy] }
    case "circle": return { ...e, center: [e.center[0] + dx, e.center[1] + dy] }
    case "arc": return { ...e, center: [e.center[0] + dx, e.center[1] + dy] }
    case "polyline": return { ...e, points: e.points.map(p => [p[0] + dx, p[1] + dy]) as [number, number][] }
    case "rectangle": return { ...e, x: e.x + dx, y: e.y + dy }
    case "slot": return { ...e, center: [e.center[0] + dx, e.center[1] + dy] }
    case "ellipse": return { ...e, center: [e.center[0] + dx, e.center[1] + dy] }
    case "fold": return { ...e, start: [e.start[0] + dx, e.start[1] + dy], end: [e.end[0] + dx, e.end[1] + dy] }
    case "text": return { ...e, position: [e.position[0] + dx, e.position[1] + dy] }
    case "dimension": return { ...e, start: [e.start[0] + dx, e.start[1] + dy], end: [e.end[0] + dx, e.end[1] + dy] }
    default: return e
  }
}

export function pointToEntityDistance(e: Entity, px: number, py: number): number {
  switch (e.type) {
    case "line":
    case "fold":
    case "dimension": {
      const [x1, y1] = e.start
      const [x2, y2] = e.end
      const dx = x2 - x1, dy = y2 - y1
      const len2 = dx * dx + dy * dy
      if (len2 === 0) return Math.hypot(px - x1, py - y1)
      let t = ((px - x1) * dx + (py - y1) * dy) / len2
      t = Math.max(0, Math.min(1, t))
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
    }
    case "circle":
      return Math.abs(Math.hypot(px - e.center[0], py - e.center[1]) - e.radius)
    case "arc": {
      const dist = Math.hypot(px - e.center[0], py - e.center[1])
      const angle = Math.atan2(py - e.center[1], px - e.center[0]) * 180 / Math.PI
      const angleNorm = ((angle % 360) + 360) % 360
      const sa = ((e.startAngle % 360) + 360) % 360
      const ea = ((e.endAngle % 360) + 360) % 360
      const inArc = sa < ea ? (angleNorm >= sa && angleNorm <= ea) : (angleNorm >= sa || angleNorm <= ea)
      return inArc ? Math.abs(dist - e.radius) : Infinity
    }
    case "rectangle": {
      const left = e.x, right = e.x + e.width, bottom = e.y, top = e.y + e.height
      if (px >= left && px <= right && py >= bottom && py <= top) return 0
      const dx = Math.max(left - px, 0, px - right)
      const dy = Math.max(bottom - py, 0, py - top)
      return Math.hypot(dx, dy)
    }
    case "polyline": {
      let minDist = Infinity
      for (let i = 0; i < e.points.length - 1; i++) {
        const [x1, y1] = e.points[i]
        const [x2, y2] = e.points[i + 1]
        const dx = x2 - x1, dy = y2 - y1
        const len2 = dx * dx + dy * dy
        if (len2 === 0) { minDist = Math.min(minDist, Math.hypot(px - x1, py - y1)); continue }
        let t = ((px - x1) * dx + (py - y1) * dy) / len2
        t = Math.max(0, Math.min(1, t))
        minDist = Math.min(minDist, Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)))
      }
      return minDist
    }
    case "slot":
      return Math.abs(Math.hypot(px - e.center[0], py - e.center[1]) - e.length / 2)
    case "ellipse": {
      const dx = (px - e.center[0]) / e.radiusX
      const dy = (py - e.center[1]) / e.radiusY
      return Math.abs(Math.hypot(dx, dy) - 1) * Math.min(e.radiusX, e.radiusY)
    }
    case "text":
      return Math.hypot(px - e.position[0], py - e.position[1])
    default: return Infinity
  }
}

export function createEntity(tool: Tool, p1: [number, number], p2: [number, number]): Entity | null {
  switch (tool) {
    case "add-line": return { type: "line", start: p1, end: p2, layer: "CUT" }
    case "add-circle": {
      const r = Math.hypot(p2[0] - p1[0], p2[1] - p1[1])
      return { type: "circle", center: p1, radius: r, layer: "CUT" }
    }
    case "add-rectangle": {
      const x = Math.min(p1[0], p2[0])
      const y = Math.min(p1[1], p2[1])
      return { type: "rectangle", x, y, width: Math.abs(p2[0] - p1[0]), height: Math.abs(p2[1] - p1[1]), layer: "CUT" }
    }
    case "add-fold": return { type: "fold", start: p1, end: p2, angle: 90, direction: "up", layer: "FOLD" }
    default: return null
  }
}

export function rotateEntity(e: Entity, cx: number, cy: number, cos: number, sin: number): Entity {
  const rp = (p: [number, number]): [number, number] => {
    const dx = p[0] - cx, dy = p[1] - cy
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  }
  switch (e.type) {
    case "line": return { ...e, start: rp(e.start), end: rp(e.end) }
    case "circle": return { ...e, center: rp(e.center) }
    case "arc": return { ...e, center: rp(e.center), startAngle: e.startAngle + 90, endAngle: e.endAngle + 90 }
    case "polyline": return { ...e, points: e.points.map(rp) }
    case "rectangle": {
      const raw: [number, number][] = [[e.x, e.y], [e.x + e.width, e.y], [e.x + e.width, e.y + e.height], [e.x, e.y + e.height]]
      return { type: "polyline", points: raw.map(rp), closed: true, layer: e.layer }
    }
    case "slot": return { ...e, center: rp(e.center), angle: e.angle + 90 }
    case "ellipse": return { ...e, center: rp(e.center), angle: e.angle + 90 }
    case "fold": return { ...e, start: rp(e.start), end: rp(e.end) }
    case "text": return { ...e, position: rp(e.position), angle: e.angle + 90 }
    case "dimension": return { ...e, start: rp(e.start), end: rp(e.end) }
    default: return e
  }
}

export function updateEntitiesInGeometry(geom: PlanGeometry, activeView: number, entities: Entity[]): PlanGeometry {
  if (geom.views && geom.views.length > 0 && activeView < geom.views.length) {
    const newViews = [...geom.views]
    newViews[activeView] = { ...newViews[activeView], entities }
    const primaryView = newViews.find(v => v.name === "flat_pattern" || v.name === "front")
    return { ...geom, views: newViews, entities: primaryView ? primaryView.entities : entities }
  }
  return { ...geom, entities }
}

export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: ViewTransform) {
  const sp = 10 * t.scale
  if (sp >= 8) {
    ctx.strokeStyle = "#e0e0e0"
    ctx.lineWidth = 0.5
    const sx = Math.floor(-t.offsetX / sp) * sp + t.offsetX
    const sy = Math.floor(-t.offsetY / sp) * sp + t.offsetY
    ctx.beginPath()
    for (let x = sx; x < w; x += sp) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
    for (let y = sy; y < h; y += sp) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
    ctx.stroke()
    const mp = sp * 5
    if (mp > 20) {
      ctx.strokeStyle = "#cccccc"
      ctx.lineWidth = 0.8
      const mx = Math.floor(-t.offsetX / mp) * mp + t.offsetX
      const my = Math.floor(-t.offsetY / mp) * mp + t.offsetY
      ctx.beginPath()
      for (let x = mx; x < w; x += mp) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = my; y < h; y += mp) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()
    }
  }
}

export function drawEntity(ctx: CanvasRenderingContext2D, entity: Entity, t: ViewTransform) {
  switch (entity.type) {
    case "line": {
      const [sx, sy] = toScreen(entity.start[0], entity.start[1], t)
      const [ex, ey] = toScreen(entity.end[0], entity.end[1], t)
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
      break
    }
    case "circle": {
      const [cx, cy] = toScreen(entity.center[0], entity.center[1], t)
      ctx.beginPath(); ctx.arc(cx, cy, entity.radius * t.scale, 0, Math.PI * 2); ctx.stroke()
      break
    }
    case "arc": {
      const [cx, cy] = toScreen(entity.center[0], entity.center[1], t)
      ctx.beginPath(); ctx.arc(cx, cy, entity.radius * t.scale, -entity.startAngle * Math.PI / 180, -entity.endAngle * Math.PI / 180, false); ctx.stroke()
      break
    }
    case "polyline": {
      if (entity.points.length === 0) break
      ctx.beginPath()
      const [fx, fy] = toScreen(entity.points[0][0], entity.points[0][1], t)
      ctx.moveTo(fx, fy)
      for (let i = 1; i < entity.points.length; i++) {
        const [px, py] = toScreen(entity.points[i][0], entity.points[i][1], t)
        ctx.lineTo(px, py)
      }
      if (entity.closed) ctx.closePath()
      ctx.stroke()
      break
    }
    case "rectangle": {
      const pts: [number, number][] = [[entity.x, entity.y], [entity.x + entity.width, entity.y], [entity.x + entity.width, entity.y + entity.height], [entity.x, entity.y + entity.height]]
      ctx.beginPath()
      const [fx, fy] = toScreen(pts[0][0], pts[0][1], t)
      ctx.moveTo(fx, fy)
      for (let i = 1; i < pts.length; i++) { const [px, py] = toScreen(pts[i][0], pts[i][1], t); ctx.lineTo(px, py) }
      ctx.closePath(); ctx.stroke()
      break
    }
    case "slot": {
      const { center, length, width, angle } = entity
      const hl = length / 2, hw = width / 2
      const rad = (angle * Math.PI) / 180
      const cos = Math.cos(rad), sin = Math.sin(rad)
      const dx = hl * cos, dy = hl * sin, px = -hw * sin, py = hw * cos
      const p1 = toScreen(center[0] - dx + px, center[1] - dy + py, t)
      const p2 = toScreen(center[0] + dx + px, center[1] + dy + py, t)
      const p4 = toScreen(center[0] - dx - px, center[1] - dy - py, t)
      const r = hw * t.scale
      ctx.beginPath()
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1])
      ctx.arc(p2[0], p2[1], r, -(angle + 90) * Math.PI / 180, -(angle + 270) * Math.PI / 180, false)
      ctx.lineTo(p4[0], p4[1])
      ctx.arc(p4[0], p4[1], r, -(angle + 270) * Math.PI / 180, -(angle + 90) * Math.PI / 180, false)
      ctx.closePath(); ctx.stroke()
      break
    }
    case "ellipse": {
      const [cx, cy] = toScreen(entity.center[0], entity.center[1], t)
      ctx.beginPath()
      ctx.ellipse(cx, cy, entity.radiusX * t.scale, entity.radiusY * t.scale, (entity.angle * Math.PI) / 180, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case "fold": {
      const [sx, sy] = toScreen(entity.start[0], entity.start[1], t)
      const [ex, ey] = toScreen(entity.end[0], entity.end[1], t)
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
      const mx = (sx + ex) / 2, my = (sy + ey) / 2
      ctx.fillStyle = ctx.strokeStyle
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(`${entity.angle}° ${entity.direction}`, mx, my - 6)
      break
    }
    case "text": {
      const [tx, ty] = toScreen(entity.position[0], entity.position[1], t)
      ctx.font = `${entity.height * t.scale}px sans-serif`
      ctx.textAlign = "left"
      ctx.fillText(entity.text, tx, ty)
      break
    }
    case "dimension": {
      const [sx, sy] = toScreen(entity.start[0], entity.start[1], t)
      const [ex, ey] = toScreen(entity.end[0], entity.end[1], t)
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
      const dx = ex - sx, dy = ey - sy
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len > 0) {
        const nx = -dy / len * entity.offset * t.scale
        const ny = dx / len * entity.offset * t.scale
        ctx.beginPath()
        ctx.moveTo(sx, sy); ctx.lineTo(sx + nx, sy + ny)
        ctx.moveTo(ex, ey); ctx.lineTo(ex + nx, ey + ny)
        ctx.stroke()
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(entity.text, (sx + ex) / 2 + nx * 0.5, (sy + ey) / 2 + ny * 0.5)
      }
      break
    }
  }
}

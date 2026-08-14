import type { Entity, Point, ToolpathSeg, ViewState } from "../../types/types"

/**
 * Canvas nesting = superficie oscura fija. Textos DXF en negro/gris
 * oscuro no se ven: remapeamos a ink claro legible.
 */
export function resolveCanvasInk(color: string, lightInk = "#e4e4e7"): string {
  const c = (color || "").trim().toLowerCase()
  if (!c || c === "black" || c === "#000" || c === "#000000") return lightInk

  let r = 0, g = 0, b = 0
  if (c.startsWith("#") && (c.length === 7 || c.length === 4)) {
    if (c.length === 7) {
      r = parseInt(c.slice(1, 3), 16)
      g = parseInt(c.slice(3, 5), 16)
      b = parseInt(c.slice(5, 7), 16)
    } else {
      r = parseInt(c[1] + c[1], 16)
      g = parseInt(c[2] + c[2], 16)
      b = parseInt(c[3] + c[3], 16)
    }
  } else {
    const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/)
    if (!m) return color
    r = +m[1]
    g = +m[2]
    b = +m[3]
  }
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L < 0.22 ? lightInk : color
}


/**
 * Caché de Path2D + AABB por entidad, y utilidades de culling de
 * viewport — extraído de draw.ts (que ya pasaba las 1000 líneas) sin
 * cambiar ninguna lógica, solo moviendo estas funciones autocontenidas
 * (no dependen de estado interno de drawScene, solo de sus parámetros)
 * a su propio archivo.
 */

export type Aabb = { minX: number; minY: number; maxX: number; maxY: number }

export function aabbIntersects(a: Aabb, b: Aabb): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY)
}

export function entityAabb(e: Entity): Aabb | null {
  if (e.kind === "line") {
    return {
      minX: Math.min(e.a.x, e.b.x),
      minY: Math.min(e.a.y, e.b.y),
      maxX: Math.max(e.a.x, e.b.x),
      maxY: Math.max(e.a.y, e.b.y),
    }
  }
  if (e.kind === "polyline") {
    if (e.points.length === 0) return null
    let minX = e.points[0].x, maxX = e.points[0].x
    let minY = e.points[0].y, maxY = e.points[0].y
    for (let i = 1; i < e.points.length; i++) {
      const p = e.points[i]
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    return { minX, minY, maxX, maxY }
  }
  if (e.kind === "circle") {
    const { x, y } = e.center
    const r = e.radius
    return { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r }
  }
  if (e.kind === "arc") {
    // Conservador: bbox del círculo completo (barato y seguro)
    const { x, y } = e.center
    const r = e.radius
    return { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r }
  }
  if (e.kind === "text") {
    return { minX: e.position.x, minY: e.position.y - e.height, maxX: e.position.x + e.height * 4, maxY: e.position.y }
  }
  return null
}

/** Viewport visible en coords mundo (incluye rotación 90°). */
export function viewportWorldAabb(
  view: ViewState,
  canvasW: number,
  canvasH: number,
): Aabb {
  const { scale, offsetX, offsetY, rotationDeg = 0 } = view
  const inv = 1 / Math.max(scale, 1e-12)
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
      const ix = cy
      const iy = -cx
      cx = ix
      cy = iy
    }
    corners.push({ x: cx * inv, y: cy * inv })
  }
  let minX = corners[0].x, maxX = corners[0].x
  let minY = corners[0].y, maxY = corners[0].y
  for (const c of corners) {
    if (c.x < minX) minX = c.x
    if (c.x > maxX) maxX = c.x
    if (c.y < minY) minY = c.y
    if (c.y > maxY) maxY = c.y
  }
  // margen extra para strokes
  const pad = 2 * inv
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

export function buildEntityPath(e: Entity): Path2D | null {
  const path = new Path2D()
  if (e.kind === "line") {
    path.moveTo(e.a.x, e.a.y)
    path.lineTo(e.b.x, e.b.y)
    return path
  }
  if (e.kind === "polyline") {
    if (e.points.length < 2) return null
    e.points.forEach((pt, i) => (i === 0 ? path.moveTo(pt.x, pt.y) : path.lineTo(pt.x, pt.y)))
    if (e.closed) path.closePath()
    return path
  }
  if (e.kind === "circle") {
    path.arc(e.center.x, e.center.y, e.radius, 0, Math.PI * 2)
    return path
  }
  if (e.kind === "arc") {
    path.arc(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle)
    return path
  }
  return null
}

export type CachedEntity = {
  entity: Entity
  path: Path2D | null
  bounds: Aabb | null
}

/** Cache de Path2D: se invalida solo cuando cambia la referencia de `entities`. */
let pathCacheEntities: Entity[] | null = null
let pathCache: CachedEntity[] = []

export function getPathCache(entities: Entity[]): CachedEntity[] {
  if (entities === pathCacheEntities) return pathCache
  pathCacheEntities = entities
  pathCache = entities.map((entity) => ({
    entity,
    path: buildEntityPath(entity),
    bounds: entityAabb(entity),
  }))
  return pathCache
}

export function strokeEntity(ctx: CanvasRenderingContext2D, e: Entity, scale: number) {
  if (e.kind === "text") {
    ctx.save()
    ctx.font = `${e.height}px sans-serif`
    ctx.fillStyle = resolveCanvasInk(e.color)
    ctx.fillText(e.text, e.position.x, e.position.y)
    ctx.restore()
    return
  }
  const path = buildEntityPath(e)
  if (path) ctx.stroke(path)
}

export function strokeToolpathUntil(
  ctx: CanvasRenderingContext2D,
  toolpath: ToolpathSeg[],
  totalPathLength: number,
  fullPath2D: Path2D | null,
  targetLen: number,
  scale: number
): Point | null {
  if (totalPathLength <= 0 || targetLen <= 0) return null

  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 2.2 / scale
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (targetLen >= totalPathLength - 1e-6 && fullPath2D) {
    ctx.stroke(fullPath2D)
    const lastSeg = toolpath[toolpath.length - 1]
    return lastSeg?.points[lastSeg.points.length - 1] ?? null
  }

  let headPoint: Point | null = null
  for (const seg of toolpath) {
    if (seg.startLen >= targetLen) break

    if (seg.endLen <= targetLen) {
      ctx.beginPath()
      seg.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
      headPoint = seg.points[seg.points.length - 1]
    } else {
      let acc = seg.startLen
      ctx.beginPath()
      ctx.moveTo(seg.points[0].x, seg.points[0].y)
      for (let i = 0; i < seg.points.length - 1; i++) {
        const p1 = seg.points[i]
        const p2 = seg.points[i + 1]
        const partLen = Math.hypot(p2.x - p1.x, p2.y - p1.y)
        if (acc + partLen >= targetLen) {
          const t = partLen > 0 ? (targetLen - acc) / partLen : 0
          headPoint = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }
          ctx.lineTo(headPoint.x, headPoint.y)
          break
        }
        ctx.lineTo(p2.x, p2.y)
        acc += partLen
      }
      ctx.stroke()
    }
  }
  return headPoint
}
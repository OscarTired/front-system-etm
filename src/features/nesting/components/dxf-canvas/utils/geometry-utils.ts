import type { Entity, NestingPieceInput, Point } from "../types/types"
import { HIT_TOLERANCE_PX } from "../types/types"

export function computeBounds(entities: Entity[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const expand = (p: Point) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  for (const e of entities) {
    if (e.kind === "line") {
      expand(e.a)
      expand(e.b)
    } else if (e.kind === "polyline") {
      e.points.forEach(expand)
    } else if (e.kind === "circle") {
      expand({ x: e.center.x - e.radius, y: e.center.y - e.radius })
      expand({ x: e.center.x + e.radius, y: e.center.y + e.radius })
    } else if (e.kind === "arc") {
      expand({ x: e.center.x - e.radius, y: e.center.y - e.radius })
      expand({ x: e.center.x + e.radius, y: e.center.y + e.radius })
    } else if (e.kind === "text") {
      expand(e.position)
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
  return { minX, minY, maxX, maxY }
}

/** Ray casting estándar para hit-test de selección de pieza. */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

/** Área por la fórmula del shoelace (valor absoluto). */
export function polygonArea(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    sum += p1.x * p2.y - p2.x * p1.y
  }
  return Math.abs(sum) / 2
}

export function polygonPerimeter(points: Point[]): number {
  let total = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    total += Math.hypot(p2.x - p1.x, p2.y - p1.y)
  }
  return total
}

export function angleOfVector(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

export function fmtMm(v: number): string {
  return `${v.toFixed(1)}mm`
}

/** Distancia punto–segmento en coordenadas locales. */
export function distPointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** ¿Punto cerca de una polilínea (abierta o cerrada) dentro de tolerancia local? */
export function pointNearPolyline(
  point: Point,
  points: Point[],
  tol: number,
  closed = false
): boolean {
  if (points.length < 2) {
    if (points.length === 1) return Math.hypot(point.x - points[0].x, point.y - points[0].y) <= tol
    return false
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distPointToSegment(point, points[i], points[i + 1]) <= tol) return true
  }
  if (closed && points.length >= 3) {
    if (distPointToSegment(point, points[points.length - 1], points[0]) <= tol) return true
  }
  return false
}

function collectPiecePoints(piece: NestingPieceInput): Point[] {
  const pts: Point[] = []
  if (piece.outline?.length) pts.push(...piece.outline)
  for (const sub of piece.subOutlines) pts.push(...sub.points)
  return pts
}

function pieceBBox(piece: NestingPieceInput): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} | null {
  const pts = collectPiecePoints(piece)
  if (pts.length === 0) return null
  let minX = pts[0].x
  let maxX = pts[0].x
  let minY = pts[0].y
  let maxY = pts[0].y
  for (let i = 1; i < pts.length; i++) {
    minX = Math.min(minX, pts[i].x)
    maxX = Math.max(maxX, pts[i].x)
    minY = Math.min(minY, pts[i].y)
    maxY = Math.max(maxY, pts[i].y)
  }
  return { minX, minY, maxX, maxY }
}

/**
 * Hit-test de pieza robusto para nesting industrial:
 * 1) relleno del outline fusionado (si existe),
 * 2) relleno de subOutlines con ≥3 puntos (aunque closed:false),
 * 3) proximidad a segmentos (subOutlines abiertas / trazos finos),
 * 4) bbox expandido como fallback.
 * Devuelve el índice superior (última pieza dibujada) o null.
 */
export function findPieceAtPoint(
  point: Point,
  pieces: NestingPieceInput[],
  scale: number
): number | null {
  const tol = HIT_TOLERANCE_PX / Math.max(scale, 1e-6)

  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i]

    if (piece.outline && piece.outline.length >= 3 && pointInPolygon(point, piece.outline)) {
      return i
    }

    for (const sub of piece.subOutlines) {
      if (sub.points.length >= 3 && pointInPolygon(point, sub.points)) return i
      if (pointNearPolyline(point, sub.points, tol, false)) return i
    }

    if (piece.outline && pointNearPolyline(point, piece.outline, tol, true)) return i

    const box = pieceBBox(piece)
    if (
      box &&
      point.x >= box.minX - tol &&
      point.x <= box.maxX + tol &&
      point.y >= box.minY - tol &&
      point.y <= box.maxY + tol
    ) {
      // Solo aceptar bbox si el punto está “cerca” del contenido (evita cajas enormes vacías).
      // Para piezas densas el relleno/segmento ya matcheó; bbox es red de seguridad.
      const w = box.maxX - box.minX
      const h = box.maxY - box.minY
      if (w * h < 1e-6) {
        if (Math.hypot(point.x - (box.minX + box.maxX) / 2, point.y - (box.minY + box.maxY) / 2) <= tol) {
          return i
        }
      } else if (
        point.x >= box.minX &&
        point.x <= box.maxX &&
        point.y >= box.minY &&
        point.y <= box.maxY
      ) {
        return i
      }
    }
  }

  return null
}

/** Aplica offset de drag en vivo a un punto si su pieza está en el set. */
export function withDragOffset(
  p: Point,
  pieceIndex: number | undefined,
  drag: { indices: Set<number>; dx: number; dy: number } | null
): Point {
  if (!drag || pieceIndex === undefined || !drag.indices.has(pieceIndex)) return p
  return { x: p.x + drag.dx, y: p.y + drag.dy }
}



/**
 * Intersección H/V con regla anti-doble-conteo en vértices.
 */
function intersectHorizontal(y0: number, a: Point, b: Point): number | null {
  if (Math.abs(b.y - a.y) < 1e-12) return null
  let y1 = a.y, y2 = b.y, x1 = a.x, x2 = b.x
  if (y1 > y2) { y1 = b.y; y2 = a.y; x1 = b.x; x2 = a.x }
  if (y0 < y1 - 1e-12 || y0 >= y2 - 1e-12) return null
  const tt = (y0 - y1) / (y2 - y1)
  return x1 + tt * (x2 - x1)
}

function intersectVertical(x0: number, a: Point, b: Point): number | null {
  if (Math.abs(b.x - a.x) < 1e-12) return null
  let x1 = a.x, x2 = b.x, y1 = a.y, y2 = b.y
  if (x1 > x2) { x1 = b.x; x2 = a.x; y1 = b.y; y2 = a.y }
  if (x0 < x1 - 1e-12 || x0 >= x2 - 1e-12) return null
  const tt = (x0 - x1) / (x2 - x1)
  return y1 + tt * (y2 - y1)
}

function dedupeSorted(hits: number[], eps = 1e-6): number[] {
  if (hits.length === 0) return hits
  hits.sort((u, v) => u - v)
  const out: number[] = [hits[0]]
  for (let i = 1; i < hits.length; i++) {
    if (Math.abs(hits[i] - out[out.length - 1]) > eps) out.push(hits[i])
  }
  return out
}

function normalizeLoop(polygon: Point[]): Point[] | null {
  if (polygon.length < 3) return null
  let pts = polygon
  const f = polygon[0]
  const l = polygon[polygon.length - 1]
  if (Math.hypot(f.x - l.x, f.y - l.y) < 1e-4 && polygon.length >= 4) {
    pts = polygon.slice(0, -1)
  }
  return pts.length >= 3 ? pts : null
}

/**
 * Span H/V real del polígono por el punto (raycast a aristas).
 * El polígono se trata siempre como cerrado.
 */
export function axisSpanThroughPoint(
  polygon: Point[],
  origin: Point,
  axis: "h" | "v",
): { a: Point; b: Point; value: number } | null {
  const pts = normalizeLoop(polygon)
  if (!pts) return null
  if (!pointInPolygon(origin, pts)) return null

  const hits: number[] = []
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    if (axis === "h") {
      const x = intersectHorizontal(origin.y, a, b)
      if (x != null) hits.push(x)
    } else {
      const y = intersectVertical(origin.x, a, b)
      if (y != null) hits.push(y)
    }
  }
  const uniq = dedupeSorted(hits)
  if (uniq.length < 2) return null

  const o = axis === "h" ? origin.x : origin.y
  for (let i = 0; i + 1 < uniq.length; i += 2) {
    const lo = uniq[i]
    const hi = uniq[i + 1]
    if (o >= lo - 1e-6 && o <= hi + 1e-6) {
      const value = hi - lo
      if (value < 1e-6) return null
      return axis === "h"
        ? { a: { x: lo, y: origin.y }, b: { x: hi, y: origin.y }, value }
        : { a: { x: origin.x, y: lo }, b: { x: origin.x, y: hi }, value }
    }
  }
  const lo = uniq[0]
  const hi = uniq[uniq.length - 1]
  const value = hi - lo
  if (value < 1e-6) return null
  return axis === "h"
    ? { a: { x: lo, y: origin.y }, b: { x: hi, y: origin.y }, value }
    : { a: { x: origin.x, y: lo }, b: { x: origin.x, y: hi }, value }
}

export type SmartSpan = { a: Point; b: Point; value: number }

/**
 * Contorno (cualquier polyline ≥3 pts, closed o no) que contiene el punto
 * → spans H/V. Preferimos el de menor área (pieza / calado interno).
 */
export function findSmartSpansAtPoint(
  entities: Entity[],
  origin: Point,
): { h: SmartSpan | null; v: SmartSpan | null; center: Point } | null {
  let best: {
    h: SmartSpan | null
    v: SmartSpan | null
    center: Point
    area: number
  } | null = null

  for (const e of entities) {
    if (e.kind !== "polyline" || e.points.length < 3) continue
    const pts = normalizeLoop(e.points)
    if (!pts) continue
    if (!pointInPolygon(origin, pts)) continue
    const h = axisSpanThroughPoint(pts, origin, "h")
    const v = axisSpanThroughPoint(pts, origin, "v")
    if (!h && !v) continue
    const area = Math.abs(polygonArea(pts))
    if (!best || area < best.area) {
      best = { h, v, center: { x: origin.x, y: origin.y }, area }
    }
  }
  if (!best) return null
  return { h: best.h, v: best.v, center: best.center }
}

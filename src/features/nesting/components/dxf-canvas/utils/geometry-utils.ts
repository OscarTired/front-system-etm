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

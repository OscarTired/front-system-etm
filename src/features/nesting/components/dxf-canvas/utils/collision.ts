import type { Point } from "../types/types"
import type { NestingPieceInput } from "../types/types"

/**
 * ¿Se solapan dos polígonos? (mismo criterio que el motor de nesting)
 * 1) bbox rechazo rápido
 * 2) cruce de aristas o uno dentro del otro
 */
function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const orient = (p: Point, q: Point, r: Point) => {
    const v = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)
    if (Math.abs(v) < 1e-9) return 0
    return v > 0 ? 1 : 2
  }
  const onSeg = (p: Point, q: Point, r: Point) =>
    q.x <= Math.max(p.x, r.x) + 1e-9 &&
    q.x >= Math.min(p.x, r.x) - 1e-9 &&
    q.y <= Math.max(p.y, r.y) + 1e-9 &&
    q.y >= Math.min(p.y, r.y) - 1e-9

  const o1 = orient(a1, a2, b1)
  const o2 = orient(a1, a2, b2)
  const o3 = orient(b1, b2, a1)
  const o4 = orient(b1, b2, a2)
  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSeg(a1, b1, a2)) return true
  if (o2 === 0 && onSeg(a1, b2, a2)) return true
  if (o3 === 0 && onSeg(b1, a1, b2)) return true
  if (o4 === 0 && onSeg(b1, a2, b2)) return true
  return false
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y
    const xj = polygon[j].x,
      yj = polygon[j].y
    const inter =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-15) + xi
    if (inter) inside = !inside
  }
  return inside
}

function bbox(pts: Point[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

/** Solape real (no solo tocar bordes). Tolerancia pequeña permite “pegarse”. */
export function polygonsOverlap(a: Point[], b: Point[], gap = 0.01): boolean {
  if (a.length < 3 || b.length < 3) return false
  const A = bbox(a)
  const B = bbox(b)
  if (
    A.maxX < B.minX - gap ||
    B.maxX < A.minX - gap ||
    A.maxY < B.minY - gap ||
    B.maxY < A.minY - gap
  ) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    const a1 = a[i]
    const a2 = a[(i + 1) % a.length]
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j]
      const b2 = b[(j + 1) % b.length]
      if (segmentsIntersect(a1, a2, b1, b2)) return true
    }
  }
  return pointInPolygon(a[0], b) || pointInPolygon(b[0], a)
}

function translatePoly(pts: Point[], dx: number, dy: number): Point[] {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

/** Contorno de colisión de una pieza: outline fusionado, o bbox de subOutlines. */
export function pieceCollisionPolygon(piece: NestingPieceInput): Point[] | null {
  if (piece.outline && piece.outline.length >= 3) return piece.outline
  // Fallback: envolver todos los puntos de subOutlines en un rect (conservador)
  const pts: Point[] = []
  for (const s of piece.subOutlines) pts.push(...s.points)
  if (pts.length < 3) return null
  const b = bbox(pts)
  return [
    { x: b.minX, y: b.minY },
    { x: b.maxX, y: b.minY },
    { x: b.maxX, y: b.maxY },
    { x: b.minX, y: b.maxY },
  ]
}

/**
 * ¿El offset (dx,dy) deja a las piezas movidas sin solaparse con el resto
 * y dentro de la plancha (si se indica sheetSize)?
 * gap > 0 = separación mínima (kerf suave); 0 = se pueden tocar.
 */
export function isPlacementValid(
  pieces: NestingPieceInput[],
  movingIndices: number[],
  dx: number,
  dy: number,
  sheetSize?: { width: number; height: number },
  gap = 0
): boolean {
  const moving = new Set(movingIndices)
  const movedPolys: Point[][] = []

  for (const idx of movingIndices) {
    const piece = pieces[idx]
    if (!piece) continue
    const poly = pieceCollisionPolygon(piece)
    if (!poly) continue
    const t = translatePoly(poly, dx, dy)

    if (sheetSize) {
      const b = bbox(t)
      if (b.minX < -gap || b.minY < -gap || b.maxX > sheetSize.width + gap || b.maxY > sheetSize.height + gap) {
        return false
      }
    }
    movedPolys.push(t)
  }

  // Entre sí el grupo móvil no debería auto-solaparse de forma nueva;
  // normalmente ya venían sin solaparse y se trasladan rígido.
  for (let i = 0; i < pieces.length; i++) {
    if (moving.has(i)) continue
    const other = pieceCollisionPolygon(pieces[i])
    if (!other) continue
    for (const mp of movedPolys) {
      if (polygonsOverlap(mp, other, gap)) return false
    }
  }
  return true
}

/**
 * Dado un offset candidato, devuelve el mayor offset libre a lo largo del
 * mismo vector (búsqueda binaria). Así las otras piezas actúan como paredes:
 * te detienes al contacto, no atraviesas.
 */
export function clampOffsetToFreeSpace(
  pieces: NestingPieceInput[],
  movingIndices: number[],
  dx: number,
  dy: number,
  sheetSize?: { width: number; height: number },
  gap = 0
): { dx: number; dy: number; blocked: boolean } {
  if (isPlacementValid(pieces, movingIndices, dx, dy, sheetSize, gap)) {
    return { dx, dy, blocked: false }
  }
  // Si ni un paso mínimo es válido, bloqueo total
  if (!isPlacementValid(pieces, movingIndices, 0, 0, sheetSize, gap)) {
    // Estado inicial ya inválido (nest con solape): permitir el intento sin clamp raro
    return { dx, dy, blocked: true }
  }

  let lo = 0
  let hi = 1
  for (let iter = 0; iter < 18; iter++) {
    const mid = (lo + hi) / 2
    if (isPlacementValid(pieces, movingIndices, dx * mid, dy * mid, sheetSize, gap)) lo = mid
    else hi = mid
  }
  return { dx: dx * lo, dy: dy * lo, blocked: lo < 0.999 }
}

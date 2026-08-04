import type { PieceOutline, Point2D, SubEntity } from "./types"

export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y
    const xj = polygon[j].x,
      yj = polygon[j].y
    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-15) + xi
    ) {
      inside = !inside
    }
  }
  return inside
}

function orient(a: Point2D, b: Point2D, c: Point2D): number {
  const v = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (Math.abs(v) < 1e-10) return 0
  return v > 0 ? 1 : 2
}

function segmentsProperIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
  const o1 = orient(a1, a2, b1)
  const o2 = orient(a1, a2, b2)
  const o3 = orient(b1, b2, a1)
  const o4 = orient(b1, b2, a2)
  if (o1 === 0 || o2 === 0 || o3 === 0 || o4 === 0) return false
  return o1 !== o2 && o3 !== o4
}

function bbox(pts: Point2D[]) {
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

function areaAbs(pts: Point2D[]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j].x * pts[i].y - pts[i].x * pts[j].y
  }
  return Math.abs(a) * 0.5
}

/** Solape de sólidos (contacto de borde OK). */
export function solidsOverlap(a: Point2D[], b: Point2D[]): boolean {
  if (a.length < 3 || b.length < 3) return false
  const A = bbox(a)
  const B = bbox(b)
  if (A.maxX <= B.minX || B.maxX <= A.minX || A.maxY <= B.minY || B.maxY <= A.minY) return false

  for (let i = 0; i < a.length; i++) {
    const a1 = a[i],
      a2 = a[(i + 1) % a.length]
    for (let j = 0; j < b.length; j++) {
      if (segmentsProperIntersect(a1, a2, b[j], b[(j + 1) % b.length])) return true
    }
  }
  const samples = [0, 0.25, 0.5, 0.75].map((t) => a[Math.min(a.length - 1, (t * a.length) | 0)])
  for (const p of samples) if (pointInPolygon(p, b)) return true
  const samplesB = [0, 0.25, 0.5, 0.75].map((t) => b[Math.min(b.length - 1, (t * b.length) | 0)])
  for (const p of samplesB) if (pointInPolygon(p, a)) return true
  return false
}

export interface SolidWithHoles {
  outer: Point2D[]
  holes: Point2D[][]
  box: { minX: number; minY: number; maxX: number; maxY: number }
}

export function extractSolidWithHoles(
  outline: PieceOutline,
  subEntities?: SubEntity[]
): SolidWithHoles {
  const rings: Point2D[][] = []
  if (outline.points.length >= 3) rings.push(outline.points)
  for (const s of subEntities ?? []) {
    if (s.outline.points.length >= 3) rings.push(s.outline.points)
  }
  if (rings.length === 0) {
    return { outer: [], holes: [], box: { minX: 0, minY: 0, maxX: 0, maxY: 0 } }
  }

  let outerIdx = 0
  let best = -1
  for (let i = 0; i < rings.length; i++) {
    const ar = areaAbs(rings[i])
    if (ar > best) {
      best = ar
      outerIdx = i
    }
  }
  const outer = rings[outerIdx]
  const holes: Point2D[][] = []
  for (let i = 0; i < rings.length; i++) {
    if (i === outerIdx) continue
    const r = rings[i]
    if (areaAbs(r) >= best * 0.98) continue
    const cx = r.reduce((s, p) => s + p.x, 0) / r.length
    const cy = r.reduce((s, p) => s + p.y, 0) / r.length
    if (pointInPolygon({ x: cx, y: cy }, outer)) holes.push(r)
  }
  return { outer, holes, box: bbox(outer) }
}

/**
 * ¿El sólido móvil colisiona con un sólido ya colocado?
 * Permitido si el móvil está completamente dentro de un hueco del otro.
 */
export function solidCollidesWith(moving: Point2D[], placed: SolidWithHoles, separation = 0): boolean {
  if (moving.length < 3 || placed.outer.length < 3) return false

  // Completamente dentro de un hueco ? OK (nesting en calado)
  for (const hole of placed.holes) {
    let allIn = true
    for (const p of moving) {
      if (!pointInPolygon(p, hole)) {
        allIn = false
        break
      }
    }
    if (allIn) return false
  }

  if (separation > 0) {
    // Aprox: expandir bbox del colocado
    const b = placed.box
    const mb = bbox(moving)
    if (
      mb.maxX + separation < b.minX ||
      b.maxX + separation < mb.minX ||
      mb.maxY + separation < b.minY ||
      b.maxY + separation < mb.minY
    ) {
      return false
    }
  }

  return solidsOverlap(moving, placed.outer)
}

export function translatePoints(pts: Point2D[], dx: number, dy: number): Point2D[] {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

/** ¿Todos los puntos de `pts` están dentro de `hole`? */
function fullyInsideHole(pts: Point2D[], hole: Point2D[]): boolean {
  if (pts.length < 1 || hole.length < 3) return false
  for (const p of pts) {
    if (!pointInPolygon(p, hole)) return false
  }
  return true
}

/**
 * Colisión entre dos piezas colocadas respetando calados:
 * si A está enteramente en un hueco de B (o al revés), NO es colisión.
 * Usar en UI de solape; no confundir con nesting en ventana.
 */
export function piecesCollide(
  a: { outline: { points: Point2D[] }; subEntities?: SubEntity[] },
  b: { outline: { points: Point2D[] }; subEntities?: SubEntity[] },
  separation = 0
): boolean {
  const sa = extractSolidWithHoles(a.outline, a.subEntities)
  const sb = extractSolidWithHoles(b.outline, b.subEntities)
  const outerA = sa.outer.length >= 3 ? sa.outer : a.outline.points
  const outerB = sb.outer.length >= 3 ? sb.outer : b.outline.points
  if (outerA.length < 3 || outerB.length < 3) return false

  for (const hole of sb.holes) {
    if (fullyInsideHole(outerA, hole)) return false
  }
  for (const hole of sa.holes) {
    if (fullyInsideHole(outerB, hole)) return false
  }

  // Contacto de borde permitido: solidsOverlap ya es estricto en intersección
  if (solidsOverlap(outerA, outerB)) return true
  if (separation > 0) {
    const ba = bbox(outerA)
    const bb = bbox(outerB)
    const gapX = Math.max(0, Math.max(ba.minX - bb.maxX, bb.minX - ba.maxX))
    const gapY = Math.max(0, Math.max(ba.minY - bb.maxY, bb.minY - ba.maxY))
    // Si se solapan en un eje y el gap en el otro es < separation
    const overlapX = ba.maxX + separation > bb.minX && bb.maxX + separation > ba.minX
    const overlapY = ba.maxY + separation > bb.minY && bb.maxY + separation > ba.minY
    if (overlapX && overlapY && (gapX < separation || gapY < separation)) {
      // Solo si realmente están cerca en 2D (bbox expandido)
      if (!(ba.maxX + separation < bb.minX || bb.maxX + separation < ba.minX ||
            ba.maxY + separation < bb.minY || bb.maxY + separation < ba.minY)) {
        return true
      }
    }
  }
  return false
}

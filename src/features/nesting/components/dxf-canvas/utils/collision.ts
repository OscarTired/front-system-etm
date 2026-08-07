import type { Point, NestingPieceInput } from "../types/types"
import { bbox as bboxOf, areaAbs, pointInPolygon, solidsOverlap, translatePoints as translatePoly } from "../../../engine/polygon-collision"

type BBox = ReturnType<typeof bboxOf>


/* ─── piece geometry: outer solid + holes (calados) ──────────────────── */

export type PieceGeom = {
  /** Contorno exterior (sólido). */
  outer: Point[]
  outerBox: BBox
  /** Huecos internos (calados). Piezas pequeñas pueden entrar aquí. */
  holes: Point[][]
}

/**
 * Heurística de outer vs holes:
 * - Si hay `outline` fusionado → outer.
 * - subOutlines cerrados (o casi): el de mayor área = outer; el resto
 *   totalmente contenidos en outer = holes.
 */
export function pieceCollisionGeom(piece: NestingPieceInput): PieceGeom | null {
  const rings: Point[][] = []

  // `piece.outline` es el respaldo "fusionado" documentado en el tipo
  // ("solo si no hay subOutlines") — antes se agregaba SIEMPRE como
  // candidato más a competir por área contra los subOutlines ya
  // correctamente encadenados. Como es una secuencia arbitraria de
  // puntos (no necesariamente un polígono real), su área por la
  // fórmula del shoelace es impredecible y a veces "ganaba" siendo
  // elegido como el contorno exterior en vez del contorno real de la
  // pieza — esto es lo que hacía que piezas colisionaran de nuevo sin
  // razón aparente. Mismo fix que en engine/polygon-collision.ts.
  if (piece.subOutlines.length > 0) {
    for (const sub of piece.subOutlines) {
      if (sub.points.length >= 3) rings.push(sub.points)
    }
  } else if (piece.outline && piece.outline.length >= 3) {
    rings.push(piece.outline)
  }

  if (rings.length === 0) return null

  // Mayor área = exterior
  let outerIdx = 0
  let bestArea = -1
  for (let i = 0; i < rings.length; i++) {
    const ar = areaAbs(rings[i])
    if (ar > bestArea) {
      bestArea = ar
      outerIdx = i
    }
  }
  const outer = rings[outerIdx]
  const outerBox = bboxOf(outer)

  const holes: Point[][] = []
  for (let i = 0; i < rings.length; i++) {
    if (i === outerIdx) continue
    const r = rings[i]
    // Hueco: centroide del anillo dentro del outer y área menor
    const cx =
      r.reduce((s, p) => s + p.x, 0) / r.length
    const cy =
      r.reduce((s, p) => s + p.y, 0) / r.length
    if (pointInPolygon({ x: cx, y: cy }, outer) && areaAbs(r) < bestArea * 0.98) {
      holes.push(r)
    }
  }

  return { outer, outerBox, holes }
}

/** @deprecated usar pieceCollisionGeom */
export function pieceCollisionPolygon(piece: NestingPieceInput): Point[] | null {
  return pieceCollisionGeom(piece)?.outer ?? null
}

/* ─── spatial index ──────────────────────────────────────────────────── */

export type CollisionIndex = {
  geoms: (PieceGeom | null)[]
  grid: Map<string, number[]>
  cellSize: number
}

function cellKey(cx: number, cy: number) {
  return cx + "," + cy
}

export function buildCollisionIndex(pieces: NestingPieceInput[]): CollisionIndex {
  const geoms: (PieceGeom | null)[] = new Array(pieces.length)
  let maxSpan = 50

  for (let i = 0; i < pieces.length; i++) {
    const g = pieceCollisionGeom(pieces[i])
    geoms[i] = g
    if (g) {
      maxSpan = Math.max(
        maxSpan,
        g.outerBox.maxX - g.outerBox.minX,
        g.outerBox.maxY - g.outerBox.minY
      )
    }
  }

  const cellSize = Math.max(40, maxSpan * 0.75)
  const grid = new Map<string, number[]>()

  for (let i = 0; i < geoms.length; i++) {
    const g = geoms[i]
    if (!g) continue
    const x0 = Math.floor(g.outerBox.minX / cellSize)
    const x1 = Math.floor(g.outerBox.maxX / cellSize)
    const y0 = Math.floor(g.outerBox.minY / cellSize)
    const y1 = Math.floor(g.outerBox.maxY / cellSize)
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = cellKey(cx, cy)
        const list = grid.get(k)
        if (list) list.push(i)
        else grid.set(k, [i])
      }
    }
  }

  return { geoms, grid, cellSize }
}

function queryCandidates(index: CollisionIndex, box: BBox, pad: number): number[] {
  const { grid, cellSize } = index
  const x0 = Math.floor((box.minX - pad) / cellSize)
  const x1 = Math.floor((box.maxX + pad) / cellSize)
  const y0 = Math.floor((box.minY - pad) / cellSize)
  const y1 = Math.floor((box.maxY + pad) / cellSize)
  const seen = new Set<number>()
  const out: number[] = []
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const list = grid.get(cellKey(cx, cy))
      if (!list) continue
      for (const i of list) {
        if (!seen.has(i)) {
          seen.add(i)
          out.push(i)
        }
      }
    }
  }
  return out
}

/**
 * ¿El sólido `moving` (outer) choca con el sólido de `other`?
 * Excepción: si `moving` está COMPLETAMENTE dentro de un hueco de `other`
 * y no solapa el material (solo el vacío del calado) → permitido.
 */
function pairCollides(movingOuter: Point[], other: PieceGeom): boolean {
  // ¿Está el móvil enteramente dentro de algún hueco del otro?
  if (other.holes.length > 0) {
    for (const hole of other.holes) {
      // Todos los vértices del móvil dentro del hueco y sin solapar el anillo del hueco como sólido inverso
      let allIn = true
      for (let i = 0; i < movingOuter.length; i++) {
        if (!pointInPolygon(movingOuter[i], hole)) {
          allIn = false
          break
        }
      }
      if (allIn) {
        // Dentro del calado: solo ilegal si penetra el borde del hueco hacia el material
        // (solape con outer del other menos el hueco ≈ solape con outer Y no solo en hueco)
        // Si está 100% en el hueco, no colisiona con material.
        return false
      }
    }
  }

  return solidsOverlap(movingOuter, other.outer)
}

export function isPlacementValid(
  pieces: NestingPieceInput[],
  movingIndices: number[],
  dx: number,
  dy: number,
  sheetSize?: { width: number; height: number },
  clearance = 0,
  index?: CollisionIndex
): boolean {
  const idx = index ?? buildCollisionIndex(pieces)
  const moving = new Set(movingIndices)

  let uMinX = Infinity,
    uMinY = Infinity,
    uMaxX = -Infinity,
    uMaxY = -Infinity
  const movedOuters: Point[][] = []
  const movedBoxes: BBox[] = []

  for (const mi of movingIndices) {
    const g = idx.geoms[mi]
    if (!g) continue
    const outer = translatePoly(g.outer, dx, dy)
    const box: BBox = {
      minX: g.outerBox.minX + dx,
      minY: g.outerBox.minY + dy,
      maxX: g.outerBox.maxX + dx,
      maxY: g.outerBox.maxY + dy,
    }
    if (sheetSize) {
      if (
        box.minX < -clearance ||
        box.minY < -clearance ||
        box.maxX > sheetSize.width + clearance ||
        box.maxY > sheetSize.height + clearance
      ) {
        return false
      }
    }
    movedOuters.push(outer)
    movedBoxes.push(box)
    if (box.minX < uMinX) uMinX = box.minX
    if (box.minY < uMinY) uMinY = box.minY
    if (box.maxX > uMaxX) uMaxX = box.maxX
    if (box.maxY > uMaxY) uMaxY = box.maxY
  }

  if (movedOuters.length === 0) return true

  const candidates = queryCandidates(
    idx,
    { minX: uMinX, minY: uMinY, maxX: uMaxX, maxY: uMaxY },
    2 + clearance
  )

  for (const ci of candidates) {
    if (moving.has(ci)) continue
    const other = idx.geoms[ci]
    if (!other) continue
    for (let m = 0; m < movedOuters.length; m++) {
      const mb = movedBoxes[m]
      if (
        mb.maxX < other.outerBox.minX ||
        other.outerBox.maxX < mb.minX ||
        mb.maxY < other.outerBox.minY ||
        other.outerBox.maxY < mb.minY
      ) {
        continue
      }
      if (pairCollides(movedOuters[m], other)) return false
    }
  }
  return true
}

/**
 * Nunca permite penetrar. Binary search + verificación del punto final.
 * Si el resultado intermedio aún penetra por float, retrocede un escalón.
 */
export function clampOffsetToFreeSpace(
  pieces: NestingPieceInput[],
  movingIndices: number[],
  dx: number,
  dy: number,
  sheetSize?: { width: number; height: number },
  clearance = 0,
  index?: CollisionIndex
): { dx: number; dy: number; blocked: boolean } {
  const idx = index ?? buildCollisionIndex(pieces)

  if (isPlacementValid(pieces, movingIndices, dx, dy, sheetSize, clearance, idx)) {
    return { dx, dy, blocked: false }
  }

  // Origen inválido (nest ya solapado): permitir solo el movimiento que MEJORA
  // (no abrir carta blanca a atravesar)
  const originOk = isPlacementValid(pieces, movingIndices, 0, 0, sheetSize, clearance, idx)

  let lo = 0
  let hi = 1
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) / 2
    if (isPlacementValid(pieces, movingIndices, dx * mid, dy * mid, sheetSize, clearance, idx)) {
      lo = mid
    } else {
      hi = mid
    }
  }

  // Seguridad: si lo aún reporta inválido (no debería), bajar
  let t = lo
  for (let s = 0; s < 8 && t > 0; s++) {
    if (isPlacementValid(pieces, movingIndices, dx * t, dy * t, sheetSize, clearance, idx)) break
    t *= 0.5
  }

  if (!originOk && t < 1e-8) {
    // No podemos ni quedarnos: no mover
    return { dx: 0, dy: 0, blocked: true }
  }

  return {
    dx: dx * t,
    dy: dy * t,
    blocked: t < 0.999,
  }
}

/* ─── magnetic snap ──────────────────────────────────────────────────── */

export type SnapGuide = {
  axis: "x" | "y"
  value: number
}

export function applyMagneticSnap(
  pieces: NestingPieceInput[],
  movingIndices: number[],
  dx: number,
  dy: number,
  scale: number,
  sheetSize?: { width: number; height: number },
  snapPx = 10,
  index?: CollisionIndex
): { dx: number; dy: number; guides: SnapGuide[] } {
  const idx = index ?? buildCollisionIndex(pieces)
  const threshold = snapPx / Math.max(scale, 1e-6)
  const moving = new Set(movingIndices)

  let mMinX = Infinity,
    mMinY = Infinity,
    mMaxX = -Infinity,
    mMaxY = -Infinity
  let has = false
  for (const mi of movingIndices) {
    const g = idx.geoms[mi]
    if (!g) continue
    has = true
    const minX = g.outerBox.minX + dx
    const minY = g.outerBox.minY + dy
    const maxX = g.outerBox.maxX + dx
    const maxY = g.outerBox.maxY + dy
    if (minX < mMinX) mMinX = minX
    if (minY < mMinY) mMinY = minY
    if (maxX > mMaxX) mMaxX = maxX
    if (maxY > mMaxY) mMaxY = maxY
  }
  if (!has) return { dx, dy, guides: [] }

  const targetsX: number[] = []
  const targetsY: number[] = []
  if (sheetSize) {
    targetsX.push(0, sheetSize.width)
    targetsY.push(0, sheetSize.height)
  }
  for (let i = 0; i < idx.geoms.length; i++) {
    if (moving.has(i)) continue
    const g = idx.geoms[i]
    if (!g) continue
    targetsX.push(g.outerBox.minX, g.outerBox.maxX)
    targetsY.push(g.outerBox.minY, g.outerBox.maxY)
  }

  let bestAdjX = 0,
    bestDistX = threshold + 1,
    guideX: number | null = null
  for (const edge of [mMinX, mMaxX]) {
    for (const t of targetsX) {
      const d = t - edge
      const ad = Math.abs(d)
      if (ad < bestDistX) {
        bestDistX = ad
        bestAdjX = d
        guideX = t
      }
    }
  }

  let bestAdjY = 0,
    bestDistY = threshold + 1,
    guideY: number | null = null
  for (const edge of [mMinY, mMaxY]) {
    for (const t of targetsY) {
      const d = t - edge
      const ad = Math.abs(d)
      if (ad < bestDistY) {
        bestDistY = ad
        bestAdjY = d
        guideY = t
      }
    }
  }

  let outDx = dx
  let outDy = dy
  const guides: SnapGuide[] = []
  if (bestDistX <= threshold) {
    outDx += bestAdjX
    if (guideX !== null) guides.push({ axis: "x", value: guideX })
  }
  if (bestDistY <= threshold) {
    outDy += bestAdjY
    if (guideY !== null) guides.push({ axis: "y", value: guideY })
  }
  return { dx: outDx, dy: outDy, guides }
}

/**
 * 1) snap  2) clamp estricto (no penetrar sólidos)
 * Snap NUNCA se aplica si deja la pieza en colisión.
 */
export function resolveDragOffset(
  pieces: NestingPieceInput[],
  movingIndices: number[],
  wantDx: number,
  wantDy: number,
  scale: number,
  sheetSize?: { width: number; height: number },
  options?: {
    clearance?: number
    snapPx?: number
    snapEnabled?: boolean
    index?: CollisionIndex
  }
): { dx: number; dy: number; blocked: boolean; guides: SnapGuide[] } {
  const clearance = options?.clearance ?? 0
  const snapEnabled = options?.snapEnabled !== false
  const snapPx = options?.snapPx ?? 10
  const index = options?.index ?? buildCollisionIndex(pieces)

  let dx = wantDx
  let dy = wantDy
  let guides: SnapGuide[] = []

  if (snapEnabled) {
    const snapped = applyMagneticSnap(
      pieces,
      movingIndices,
      dx,
      dy,
      scale,
      sheetSize,
      snapPx,
      index
    )
    // Solo aceptar snap si la posición snappeada es válida
    if (
      isPlacementValid(
        pieces,
        movingIndices,
        snapped.dx,
        snapped.dy,
        sheetSize,
        clearance,
        index
      )
    ) {
      dx = snapped.dx
      dy = snapped.dy
      guides = snapped.guides
    }
    // si el snap penetraría, se ignora y se sigue con want*
  }

  const clamped = clampOffsetToFreeSpace(
    pieces,
    movingIndices,
    dx,
    dy,
    sheetSize,
    clearance,
    index
  )

  // Guías solo si el resultado final sigue alineado
  if (guides.length && (clamped.dx !== dx || clamped.dy !== dy)) {
    guides = []
  }

  return {
    dx: clamped.dx,
    dy: clamped.dy,
    blocked: clamped.blocked,
    guides,
  }
}
import {
  applyToOutline,
  boundingRect,
  compose,
  rectCenter,
  rotateAround,
  scaleUniform,
  translate,
  IDENTITY,
  type Transform2D,
} from "../geometry"
import {
  extractSolidWithHoles,
  solidCollidesWith,
  translatePoints,
  type SolidWithHoles,
} from "../polygon-collision"
import type {
  NestedSheet,
  NestingOptions,
  NestingPiece,
  NestingStrategy,
  PieceOutline,
  PlacedPiece,
  Rect,
} from "../types"

interface RotationVariant {
  angle: number
  outline: PieceOutline
  bounds: Rect
  transform: Transform2D
  outerLocal: { x: number; y: number }[] // outer aligned at 0,0
}

function placePiece(
  piece: NestingPiece,
  variant: RotationVariant,
  x: number,
  y: number
): PlacedPiece {
  const finalTransform = compose(variant.transform, translate(x, y))
  return {
    pieceId: piece.id,
    x,
    y,
    angle: variant.angle,
    outline: applyToOutline(finalTransform, piece.outline),
    subEntities: piece.subEntities?.map((sub) => ({
      outline: applyToOutline(finalTransform, sub.outline),
      color: sub.color,
      layer: sub.layer,
    })),
    color: piece.color,
  }
}

function rotationAnglesFor(options: NestingOptions): number[] {
  const mode = options.rotationMode ?? "0-90-180-270"
  if (mode === "ninguna") return [0]
  if (mode === "libre") {
    // Compromise densidad/tiempo: cada 15°
    const angles: number[] = []
    for (let a = 0; a < 360; a += 15) angles.push(a)
    return angles
  }
  return [0, 90, 180, 270]
}

/**
 * Empaquetado por polígono real + nesting en calados (huecos).
 * Sustituye la heurística solo-AABB cuando se busca mejor aprovechamiento.
 */
export class PolygonPackingStrategy implements NestingStrategy {
  optimize(inputPieces: NestingPiece[], options: NestingOptions): NestedSheet[] {
    const { sheet, signal, onProgress } = options
    const separation = options.separation ?? 0
    const step =
      options.mode === "precise" ? Math.max(0.5, options.searchStep ?? 0.5) : options.searchStep ?? 1.5
    const angles = rotationAnglesFor(options)

    const sheets: NestedSheet[] = []
    const pieces = inputPieces.flatMap((p) => Array.from({ length: p.quantity ?? 1 }, () => p))
    if (pieces.length === 0) return sheets

    const sorted = [...pieces].sort((a, b) => {
      const boxA = boundingRect(a.outline)
      const boxB = boundingRect(b.outline)
      return boxB.width * boxB.height - boxA.width * boxA.height
    })

    const usableWidth = sheet.width - 2 * sheet.margin
    const usableHeight = sheet.height - 2 * sheet.margin
    const limitX = sheet.width - sheet.margin
    const limitY = sheet.height - sheet.margin

    // Por plancha: sólidos colocados para colisión rápida
    const sheetSolids: SolidWithHoles[][] = []

    for (let i = 0; i < sorted.length; i++) {
      if (signal?.cancelled) break
      onProgress?.(i / sorted.length)

      const piece = sorted[i]
      let outline = piece.outline
      let bounds = boundingRect(outline)
      let center = rectCenter(bounds)
      let scaleTransform: Transform2D = IDENTITY

      const fitsNormal = bounds.width <= usableWidth + 0.1 && bounds.height <= usableHeight + 0.1
      const fitsRotated = bounds.height <= usableWidth + 0.1 && bounds.width <= usableHeight + 0.1
      if (!fitsNormal && !fitsRotated) {
        const scaleNormal = Math.min(usableWidth / bounds.width, usableHeight / bounds.height)
        const scaleRotated = Math.min(usableWidth / bounds.height, usableHeight / bounds.width)
        const scaleFactor = Math.max(scaleNormal, scaleRotated) * 0.99
        scaleTransform = scaleUniform(scaleFactor)
        outline = applyToOutline(scaleTransform, outline)
        bounds = boundingRect(outline)
        center = rectCenter(bounds)
      }

      const variants: RotationVariant[] = angles.map((angle) => {
        const rotTransform = rotateAround(center, angle)
        const rotated = applyToOutline(rotTransform, outline)
        const rBounds = boundingRect(rotated)
        const alignTransform = translate(-rBounds.x, -rBounds.y)
        const aligned = applyToOutline(alignTransform, rotated)
        const fullTransform = compose(compose(scaleTransform, rotTransform), alignTransform)
        const solid = extractSolidWithHoles(aligned, piece.subEntities?.map((s) => ({
          outline: applyToOutline(fullTransform, s.outline),
          color: s.color,
          layer: s.layer,
        })))
        // outerLocal: aplicar solo scale+rot+align al outline de entrada vía aligned
        return {
          angle,
          outline: aligned,
          bounds: boundingRect(aligned),
          transform: fullTransform,
          outerLocal: solid.outer.length >= 3 ? solid.outer : aligned.points,
        }
      })

      // Preferir variantes más angostas
      variants.sort((a, b) => {
        if (Math.abs(a.bounds.width - b.bounds.width) > 0.1) return a.bounds.width - b.bounds.width
        return a.bounds.height - b.bounds.height
      })

      let placed = false

      const tryPlaceAt = (
        sheetIndex: number,
        variant: RotationVariant,
        x: number,
        y: number
      ): boolean => {
        if (x + variant.bounds.width > limitX + 0.001) return false
        if (y + variant.bounds.height > limitY + 0.001) return false
        if (x < sheet.margin - 0.001 || y < sheet.margin - 0.001) return false

        const moved = translatePoints(variant.outerLocal, x, y)
        const solids = sheetSolids[sheetIndex]
        for (const s of solids) {
          if (solidCollidesWith(moved, s, separation)) return false
        }

        // También no debe solapar con otros móviles ya puestos (mismos solids)
        const placedPiece = placePiece(piece, variant, x, y)
        sheets[sheetIndex].pieces.push(placedPiece)
        sheetSolids[sheetIndex].push(
          extractSolidWithHoles(placedPiece.outline, placedPiece.subEntities)
        )
        return true
      }

      // A) Nesting en calados de piezas ya colocadas (mejor densidad)
      for (let si = 0; si < sheets.length && !placed; si++) {
        const solids = sheetSolids[si]
        for (const host of solids) {
          if (host.holes.length === 0) continue
          for (const hole of host.holes) {
            const hb = boundingRect({ points: hole })
            for (const variant of variants) {
              if (variant.bounds.width > hb.width + 0.1 || variant.bounds.height > hb.height + 0.1) {
                continue
              }
              // Barrido grueso dentro del bbox del hueco
              for (let x = hb.x; x <= hb.x + hb.width - variant.bounds.width + 0.001 && !placed; x += step) {
                for (let y = hb.y; y <= hb.y + hb.height - variant.bounds.height + 0.001; y += step) {
                  const moved = translatePoints(variant.outerLocal, x, y)
                  // Debe caber entero en el hueco
                  let allIn = true
                  for (const p of moved) {
                    if (
                      p.x < sheet.margin ||
                      p.y < sheet.margin ||
                      p.x > limitX ||
                      p.y > limitY ||
                      !pointInHole(p, hole)
                    ) {
                      allIn = false
                      break
                    }
                  }
                  if (!allIn) continue
                  // No colisionar con otros sólidos (excepto estar en este hueco)
                  let ok = true
                  for (const s of solids) {
                    if (s === host) continue
                    if (solidCollidesWith(moved, s, separation)) {
                      ok = false
                      break
                    }
                  }
                  if (!ok) continue
                  const placedPiece = placePiece(piece, variant, x, y)
                  sheets[si].pieces.push(placedPiece)
                  sheetSolids[si].push(
                    extractSolidWithHoles(placedPiece.outline, placedPiece.subEntities)
                  )
                  placed = true
                  break
                }
              }
              if (placed) break
            }
            if (placed) break
          }
        }
      }

      // B) Barrido bottom-left en planchas existentes
      for (let si = 0; si < sheets.length && !placed; si++) {
        for (let x = sheet.margin; x <= limitX + 0.001 && !placed; x += step) {
          for (let y = sheet.margin; y <= limitY + 0.001 && !placed; y += step) {
            for (const variant of variants) {
              if (tryPlaceAt(si, variant, x, y)) {
                placed = true
                break
              }
            }
          }
        }
      }

      // C) Nueva plancha
      if (!placed) {
        let bestVariant = variants[0]
        for (const variant of variants) {
          if (variant.bounds.width <= usableWidth + 0.1 && variant.bounds.height <= usableHeight + 0.1) {
            bestVariant = variant
            break
          }
        }
        const first = placePiece(piece, bestVariant, sheet.margin, sheet.margin)
        sheets.push({ pieces: [first] })
        sheetSolids.push([extractSolidWithHoles(first.outline, first.subEntities)])
      }
    }

    onProgress?.(1)
    return sheets
  }
}

function pointInHole(p: { x: number; y: number }, hole: { x: number; y: number }[]): boolean {
  // inline PIP
  let inside = false
  for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
    const xi = hole[i].x,
      yi = hole[i].y
    const xj = hole[j].x,
      yj = hole[j].y
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-15) + xi) {
      inside = !inside
    }
  }
  return inside
}

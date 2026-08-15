/**
 * Misma cadena que NestingEngine.cpp / RectangleHeuristicStrategy:
 * rotateAround(center) → align(-bounds) → translate(x,y)
 * Solo rellena si el placement llegó sin subEntities.
 */
import {
  applyToOutline,
  boundingRect,
  compose,
  rectCenter,
  rotateAround,
  translate,
  IDENTITY,
  type Transform2D,
} from "../engine/geometry"
import type { NestedSheet, NestingPiece, PlacedPiece } from "../engine/types"

function basePieceId(id: string): string {
  const i = id.indexOf("#")
  return i >= 0 ? id.slice(0, i) : id
}

function placementTransform(src: NestingPiece, placed: PlacedPiece): Transform2D {
  const angle = placed.angle ?? 0
  const bounds = boundingRect(src.outline)
  const center = rectCenter(bounds)
  const rot = rotateAround(center, angle)
  const rotated = applyToOutline(rot, src.outline)
  const rBounds = boundingRect(rotated)
  const align = translate(-rBounds.x, -rBounds.y)
  return compose(compose(IDENTITY, compose(rot, align)), translate(placed.x, placed.y))
}

export function hydrateSheetsFromSources(
  sheets: NestedSheet[],
  sources: NestingPiece[],
): NestedSheet[] {
  const byId = new Map(sources.map(p => [p.id, p]))

  return sheets.map(sheet => ({
    ...sheet,
    pieces: sheet.pieces.map(placed => {
      if (placed.subEntities && placed.subEntities.length > 0) {
        return placed
      }

      const src =
        byId.get(placed.pieceId) ?? byId.get(basePieceId(placed.pieceId))
      if (!src) return placed

      const m = placementTransform(src, placed)

      return {
        ...placed,
        outline: applyToOutline(m, src.outline),
        subEntities: src.subEntities?.map(s => ({
          ...s,
          outline: applyToOutline(m, s.outline),
        })),
        color: placed.color ?? src.color,
      }
    }),
  }))
}

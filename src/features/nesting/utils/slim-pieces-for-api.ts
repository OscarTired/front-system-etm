/**
 * Slim del payload hacia POST /engineering/nest.
 * Canvas mantiene subEntities; en fast no se mandan huecos densos.
 */
import type { NestingPiece } from "../engine/types"

function bboxOutline(points: { x: number; y: number }[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return {
    points: [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
      { x: minX, y: minY },
    ],
  }
}

export function slimPiecesForNestApi(
  pieces: NestingPiece[],
  mode: "fast" | "precise",
): NestingPiece[] {
  if (mode === "precise") {
    return pieces.map((p) => {
      const nSub = p.subEntities?.length ?? 0
      if (nSub > 40) {
        return { ...p, subEntities: p.subEntities!.slice(0, 40) }
      }
      return p
    })
  }

  return pieces.map((p) => ({
    id: p.id,
    outline: bboxOutline(p.outline.points),
    quantity: p.quantity,
    color: p.color,
    thicknessMm: p.thicknessMm,
  }))
}

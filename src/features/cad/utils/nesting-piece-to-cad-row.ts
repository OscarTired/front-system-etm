import type { NestingPiece } from "@/features/nesting/engine/types"
import type { CadRow } from "@/features/nesting/components/piece-list"
import { boundingRect } from "@/features/nesting/engine/geometry"

export function nestingPieceToCadRow(
  piece: NestingPiece,
  fileName = "placa-cad.dxf",
): CadRow {
  const b = boundingRect(piece.outline)
  return {
    id: piece.id,
    source: "cad",
    fileName,
    outline: piece.outline,
    subEntities: piece.subEntities ?? [],
    width: b.width,
    height: b.height,
    quantity: String(piece.quantity ?? 1),
    color: piece.color ?? "#22c55e",
    material: {
      thickness: piece.thicknessMm ?? -1,
      dinNorm: "N/D",
      alloy: "N/D",
    },
  }
}

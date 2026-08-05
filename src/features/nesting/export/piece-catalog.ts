import { boundingRect, perimeterOf } from "../engine/geometry"
import type { NestedSheet } from "../engine/types"

export interface CatalogEntry {
  uid: string
  pieceId: string
  /** Nombre de archivo / etiqueta legible si se conoce. */
  displayName: string
  width: number
  height: number
  perimeter: number
  quantity: number
  angles: number[]
}

export type PieceNameMap = Record<string, string>

/**
 * Catálogo de piezas únicas (BOM). Opcionalmente resuelve nombres legibles
 * vía pieceId → fileName.
 */
export function buildPieceCatalog(
  sheets: NestedSheet[],
  nameById?: PieceNameMap
): CatalogEntry[] {
  const catalog = new Map<string, CatalogEntry>()

  for (const sheet of sheets) {
    for (const piece of sheet.pieces) {
      const bounds = boundingRect(piece.outline)
      const dim1 = Math.min(bounds.width, bounds.height)
      const dim2 = Math.max(bounds.width, bounds.height)
      const uid = `${piece.pieceId}_${dim1.toFixed(1)}_${dim2.toFixed(1)}`
      const displayName = nameById?.[piece.pieceId] ?? piece.pieceId

      const existing = catalog.get(uid)
      if (existing) {
        existing.quantity++
        if (!existing.angles.includes(piece.angle)) existing.angles.push(piece.angle)
        continue
      }

      catalog.set(uid, {
        uid,
        pieceId: piece.pieceId,
        displayName,
        width: bounds.width,
        height: bounds.height,
        perimeter: perimeterOf(piece.outline),
        quantity: 1,
        angles: [piece.angle],
      })
    }
  }

  return Array.from(catalog.values())
}

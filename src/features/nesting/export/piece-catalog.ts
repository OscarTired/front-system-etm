import { boundingRect, perimeterOf } from "../engine/geometry"
import type { NestedSheet } from "../engine/types"

export interface CatalogEntry {
  uid: string
  pieceId: string
  width: number
  height: number
  /** Perímetro aproximado (suma de segmentos del contorno tesselado). */
  perimeter: number
  quantity: number
}

/**
 * Puerto de la Fase 1 de PdfGenerator::generarReporte ("Agrupación
 * inteligente, invariante a rotación"). Agrupa todas las piezas
 * colocadas (en todas las planchas) en un catálogo de piezas únicas:
 * dos piezas son "la misma" si tienen el mismo `pieceId` y las mismas
 * dimensiones de bounding box, sin importar si una está rotada 90° y
 * la otra no (por eso se usa min/max en vez de width/height directo).
 * Útil como resumen/BOM independiente de cómo se termine mostrando
 * (HTML, PDF, tabla, etc.) — la parte de layout/dibujo del PDF
 * original queda fuera de esto a propósito.
 */
export function buildPieceCatalog(sheets: NestedSheet[]): CatalogEntry[] {
  const catalog = new Map<string, CatalogEntry>()

  for (const sheet of sheets) {
    for (const piece of sheet.pieces) {
      const bounds = boundingRect(piece.outline)
      const dim1 = Math.min(bounds.width, bounds.height)
      const dim2 = Math.max(bounds.width, bounds.height)
      const uid = `${piece.pieceId}_${dim1.toFixed(1)}_${dim2.toFixed(1)}`

      const existing = catalog.get(uid)
      if (existing) {
        existing.quantity++
        continue
      }

      catalog.set(uid, {
        uid,
        pieceId: piece.pieceId,
        width: bounds.width,
        height: bounds.height,
        perimeter: perimeterOf(piece.outline),
        quantity: 1,
      })
    }
  }

  return Array.from(catalog.values())
}

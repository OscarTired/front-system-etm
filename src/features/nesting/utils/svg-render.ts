import type { NestedSheet, SubEntity } from "../engine/types"

/**
 * Combina todas las sub-entidades del mismo color en un único string de
 * `d` de SVG <path> (con múltiples subtrazos "M...L..." separados),
 * en vez de un <polyline> por entidad. Para una pieza con miles de
 * entidades (típico en piezas con muchos huecos/perforaciones), esto
 * reduce el conteo de nodos DOM de miles a 1-2 (uno por color
 * presente: verde=corte, naranja=doblez/marca), sin cambiar el
 * resultado visual — es la misma geometría, solo agrupada.
 */
export function buildPathsByColor(subEntities: SubEntity[]): Map<string, string> {
  const segmentsByColor = new Map<string, string[]>()

  for (const sub of subEntities) {
    const color = sub.color ?? "#22c55e"
    const points = sub.outline.points
    if (points.length === 0) continue

    const d = `M ${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L ")}`

    if (!segmentsByColor.has(color)) segmentsByColor.set(color, [])
    segmentsByColor.get(color)!.push(d)
  }

  const result = new Map<string, string>()
  for (const [color, segments] of segmentsByColor) {
    result.set(color, segments.join(" "))
  }
  return result
}

export interface SheetGroup {
  sheet: NestedSheet
  /** Índice (0-based) de la primera plancha de este grupo dentro del arreglo original. */
  startIndex: number
  /** Cuántas planchas consecutivas comparten exactamente el mismo layout. */
  count: number
}

function sheetSignature(sheet: NestedSheet): string {
  return sheet.pieces
    .map((p) => `${p.pieceId}|${Math.round(p.x)}|${Math.round(p.y)}|${p.angle}`)
    .sort()
    .join(";")
}

/**
 * Agrupa planchas CONSECUTIVAS con exactamente el mismo layout (mismas
 * piezas, misma posición, misma rotación) en un solo grupo — igual que
 * TruTops muestra "Plancha 2-5" en vez de repetir 4 veces el mismo
 * dibujo. Solo agrupa consecutivas a propósito: es rápido de calcular
 * (una sola pasada) y cubre el caso real (piezas idénticas rellenan
 * planchas completas idénticas una tras otra); no intenta detectar
 * duplicados no consecutivos, que sería mucho más caro de calcular y
 * no aporta en la práctica para este uso.
 */
export function groupIdenticalSheets(sheets: NestedSheet[]): SheetGroup[] {
  const groups: SheetGroup[] = []

  for (let i = 0; i < sheets.length; i++) {
    const signature = sheetSignature(sheets[i])
    const last = groups[groups.length - 1]

    if (last && sheetSignature(last.sheet) === signature) {
      last.count++
    } else {
      groups.push({ sheet: sheets[i], startIndex: i, count: 1 })
    }
  }

  return groups
}

export function formatSheetRangeLabel(group: SheetGroup): string {
  const first = group.startIndex + 1
  if (group.count === 1) return `Plancha #${first}`
  const last = group.startIndex + group.count
  return `Planchas #${first}-${last}`
}

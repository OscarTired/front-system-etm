import { mapColorToCypCutLayer, resolveLayerName } from "./color-layer-map"
import type { NestedSheet, NestingPiece, Point2D, SheetConfig } from "../engine/types"

const CLOSE_TOLERANCE = 1e-4

/**
 * Escribe una POLYLINE R12 (grupo 0 POLYLINE + VERTEX... + SEQEND),
 * puerto de escribirPolylineR12. Detecta cierre automáticamente
 * (primer punto == último punto) para marcar el flag 70=1 y no
 * duplicar el vértice de cierre, igual que el original.
 *
 * NOTA IMPORTANTE (simplificación consciente frente al original): el
 * original reconstruye el "bulge" (curvatura) de cada segmento a
 * partir de las curvas Bézier reales de Qt (extractBulgePaths), así
 * que sus arcos salen como arcos DXF nativos (compactos). Mi pipeline
 * de import ya tesela arcos/círculos a polilíneas de puntos (64
 * segmentos por círculo completo — ver geometry-sampling.ts) y no
 * conserva el arco paramétrico original, así que exporto siempre con
 * bulge=0 (segmentos rectos). El archivo resultante es dimensionalmente
 * idéntico y perfectamente cortable — solo pesa más y no tiene arcos
 * "nativos" compactos. Si esto llega a importar (ej. tamaño de archivo
 * para máquinas viejas), se puede agregar ajuste de arco por
 * mínimos cuadrados sobre 3+ puntos consecutivos más adelante.
 */
function writePolylineR12(points: Point2D[], layer: string, color: number): string {
  if (points.length < 2) return ""

  let verts = points
  const first = points[0]
  const last = points[points.length - 1]
  const closed =
    Math.abs(first.x - last.x) < CLOSE_TOLERANCE && Math.abs(first.y - last.y) < CLOSE_TOLERANCE

  if (closed) verts = points.slice(0, -1)

  let out = "  0\nPOLYLINE\n"
  out += `  8\n${layer}\n`
  out += ` 62\n${color}\n`
  out += " 66\n1\n"
  out += ` 70\n${closed ? 1 : 0}\n`
  out += " 10\n0.0\n 20\n0.0\n 30\n0.0\n"

  for (const p of verts) {
    out += "  0\nVERTEX\n"
    out += `  8\n${layer}\n`
    out += ` 10\n${p.x.toFixed(4)}\n`
    out += ` 20\n${p.y.toFixed(4)}\n`
    out += " 30\n0.0\n"
  }

  out += "  0\nSEQEND\n"
  out += `  8\n${layer}\n`
  return out
}

/**
 * Puerto de Exporter::generarDXF. Genera el contenido de texto de un
 * DXF R12 (cabecera mínima y universal, sin dependencias externas) con
 * el marco de la plancha (capa MARCO_CHAPA) y cada pieza colocada, con
 * sus entidades agrupadas por capa/color según la convención CypCut.
 */
export function generateSheetDxf(sheet: NestedSheet, sheetConfig: SheetConfig): string {
  const { width, height } = sheetConfig

  // Invierte el eje Y para que el origen quede abajo-izquierda, como
  // espera AutoCAD (mi modelo interno usa Y hacia abajo desde el
  // parseo). Puerto directo de la lambda flipY del original.
  const flipY = (p: Point2D): Point2D => ({ x: p.x, y: height - p.y })

  let out = "  0\nSECTION\n  2\nENTITIES\n"

  const frame: Point2D[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
    { x: 0, y: 0 },
  ]
  out += writePolylineR12(frame, "MARCO_CHAPA", 7)

  for (const piece of sheet.pieces) {
    if (piece.subEntities && piece.subEntities.length > 0) {
      for (const sub of piece.subEntities) {
        const layerInfo = mapColorToCypCutLayer(sub.color ?? "#00FF00")
        const layerName = resolveLayerName(sub.layer, layerInfo)
        out += writePolylineR12(sub.outline.points.map(flipY), layerName, layerInfo.dxfColor)
      }
    } else {
      // Respaldo: piezas sin sub-entidades (ej. rectángulos manuales) — un solo contorno de corte.
      out += writePolylineR12(piece.outline.points.map(flipY), "CORTE_PRINCIPAL", 3)
    }
  }

  out += "  0\nENDSEC\n  0\nEOF\n"
  return out
}

/**
 * Genera el DXF de una sola pieza SIN nestear (posición 0,0, sin
 * rotar), para poder previsualizarla en el canvas antes de correr el
 * nesting. Reusa generateSheetDxf envolviéndola como una "plancha" de
 * una sola pieza, dimensionada exactamente al tamaño de la pieza (sin
 * margen) — así el marco de referencia queda pegado a la pieza en vez
 * de mostrar una plancha completa vacía alrededor de una pieza chica.
 */
export function generatePieceDxf(piece: NestingPiece): string {
  const bounds = piece.subEntities?.length
    ? piece.subEntities.flatMap((s) => s.outline.points)
    : piece.outline.points

  let minX = 0, minY = 0, maxX = 0, maxY = 0
  if (bounds.length > 0) {
    minX = maxX = bounds[0].x
    minY = maxY = bounds[0].y
    for (const p of bounds) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
  }

  const sheetConfig: SheetConfig = { width: maxX - minX, height: maxY - minY, margin: 0 }
  const sheet: NestedSheet = {
    pieces: [
      {
        pieceId: piece.id,
        x: 0,
        y: 0,
        angle: 0,
        outline: piece.outline,
        subEntities: piece.subEntities,
        color: piece.color,
      },
    ],
  }

  return generateSheetDxf(sheet, sheetConfig)
}
import { mapColorToCypCutLayer, resolveLayerName } from "./color-layer-map"
import type { NestedSheet, Point2D, SheetConfig } from "../engine/types"

/**
 * Escribe un <PolylineNode> del formato NSP, puerto de escribirPolyXML.
 * Igual que en el DXF, exporto con bulge=0 (ver nota en dxf-export.ts)
 * — el atributo `bul` queda en 0 para cada punto en vez de la
 * curvatura real.
 */
function writePolylineNode(points: Point2D[], layer: string, tlayerb: string, tlayerId: string): string {
  let out = "      <PolylineNode>\n"
  out += `        <CommonProperty selected="false" layer="${layer}" tlayer="${tlayerId}" tlayerb="${tlayerb}" note="1" offsetDis="0" offsetType="0" offsetAngleType="0" weiLianLength="0" overburnLength="0" maxProtectAngle="180" outsideType="0" outsideLength="0" isWeiLianPL="false" isWeiLianCCW="false" IsWeilianAddLead="false" autoleadin="true" IsEdgeStart="false" />\n`
  out += `        <leadIn Type="0" Angle="0" Length="0" R="0" />\n`
  out += `        <leadOut Type="0" Angle="0" Length="0" R="0" />\n`
  out += `        <weiLianPoints />\n        <protectedPoints />\n        <outsidePoints />\n`
  out += "        <pListAndBulges>\n"

  for (const p of points) {
    out += `          <endNode x="${p.x.toFixed(4)}" y="${p.y.toFixed(4)}" bul="0.000000" />\n`
  }

  out += "        </pListAndBulges>\n"
  out += "        <originShape />\n        <offsetme />\n"
  out += "      </PolylineNode>\n"
  return out
}

/**
 * Puerto de Exporter::generarNSP. Genera el XML del proyecto NSP para
 * una plancha, compatible con el software de la máquina de corte.
 */
export function generateSheetNsp(sheet: NestedSheet, sheetConfig: SheetConfig): string {
  const { width, height } = sheetConfig
  const flipY = (p: Point2D): Point2D => ({ x: p.x, y: height - p.y })

  let out = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n`
  out += `<root V1="1.0.73.24443" V2="1.0.0.25271" unit="4" ShowModel="1" ShowItemGuid="00000000-0000-0000-0000-000000000000" ViewX="${width / 2}" ViewY="${height / 2}" ViewScale="0.5">\n`
  out += "  <GroupNode>\n"
  out += `    <CommonProperty selected="false" layer="O" tlayer="1" tlayerb="" note="1" partName="" partNsetInfo="-1" partGuid="00000000-0000-0000-0000-000000000000" partEdgeGuids="" />\n`
  out += "    <shapes>\n"

  const frame: Point2D[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
    { x: 0, y: 0 },
  ]
  out += writePolylineNode(frame, "O", "MARCO_CHAPA", "1")

  for (const piece of sheet.pieces) {
    if (piece.subEntities && piece.subEntities.length > 0) {
      for (const sub of piece.subEntities) {
        const layerInfo = mapColorToCypCutLayer(sub.color ?? "#00FF00")
        const layerName = resolveLayerName(sub.layer, layerInfo)
        out += writePolylineNode(sub.outline.points.map(flipY), "I", layerName, layerInfo.nspLayer)
      }
    } else {
      out += writePolylineNode(piece.outline.points.map(flipY), "I", "CORTE_PRINCIPAL", "1")
    }
  }

  out += "    </shapes>\n  </GroupNode>\n</root>"
  return out
}

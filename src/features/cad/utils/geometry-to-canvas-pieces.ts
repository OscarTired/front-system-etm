import type { GeometryEntity, GeometryModel } from "../types/geometry-model"
import type { NestingPieceInput } from "@/features/nesting/components/dxf-canvas/types/types"

const SEG = 48

function layerColor(layer?: string): string {
  if (layer === "BEND") return "#22d3ee"
  if (layer === "HOLE") return "#fb923c"
  return "#4ade80"
}

function sampleCircle(cx: number, cy: number, r: number) {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i <= SEG; i++) {
    const a = (2 * Math.PI * i) / SEG
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  }
  return pts
}

function sampleArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) {
  let end = endDeg
  if (end <= startDeg) end += 360
  const sweep = end - startDeg
  const n = Math.max(2, Math.round((sweep / 360) * SEG))
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i <= n; i++) {
    const deg = startDeg + (sweep * i) / n
    const rad = (deg * Math.PI) / 180
    pts.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) })
  }
  return pts
}

function entityPoints(e: GeometryEntity): { x: number; y: number }[] | null {
  switch (e.type) {
    case "LINE":
      return [e.start, e.end]
    case "CIRCLE":
      return sampleCircle(e.center.x, e.center.y, e.radius)
    case "ARC":
      return sampleArc(
        e.center.x,
        e.center.y,
        e.radius,
        e.startAngle,
        e.endAngle,
      )
    case "POLYLINE":
      return e.points.length >= 2 ? [...e.points] : null
    default:
      return null
  }
}

/** GeometryModel (API) → piezas del DxfCanvas de nesting. */
export function geometryModelToCanvasPieces(
  model: GeometryModel | null,
): NestingPieceInput[] {
  if (!model) return []
  const subOutlines: NestingPieceInput["subOutlines"] = []
  for (const e of model.entities) {
    const points = entityPoints(e)
    if (!points || points.length < 2) continue
    const layer = e.layer
    subOutlines.push({
      points,
      layer,
      color: layerColor(layer),
    })
  }
  const { minX, minY, maxX, maxY } = model.bounds
  return [
    {
      subOutlines,
      outline: [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
        { x: minX, y: minY },
      ],
    },
  ]
}

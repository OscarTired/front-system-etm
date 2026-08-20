import type { PlanGeometry, Entity } from "../types"
import type {
  NestingPiece,
  PieceOutline,
  SubEntity,
  Point2D,
} from "@/features/nesting/engine/types"
import { boundingRect } from "@/features/nesting/engine/geometry"

const SEGMENTS_PER_FULL_CIRCLE = 64

function sampleCircle(cx: number, cy: number, r: number): Point2D[] {
  const pts: Point2D[] = []
  for (let i = 0; i <= SEGMENTS_PER_FULL_CIRCLE; i++) {
    const a = (2 * Math.PI * i) / SEGMENTS_PER_FULL_CIRCLE
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
): Point2D[] {
  let end = endDeg
  if (end <= startDeg) end += 360
  const sweep = end - startDeg
  const segments = Math.max(2, Math.round((sweep / 360) * SEGMENTS_PER_FULL_CIRCLE))
  const pts: Point2D[] = []
  for (let i = 0; i <= segments; i++) {
    const deg = startDeg + (sweep * i) / segments
    const rad = (deg * Math.PI) / 180
    pts.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) })
  }
  return pts
}

function rectCorners(e: Extract<Entity, { type: "rectangle" }>): Point2D[] {
  return [
    { x: e.x, y: e.y },
    { x: e.x + e.width, y: e.y },
    { x: e.x + e.width, y: e.y + e.height },
    { x: e.x, y: e.y + e.height },
    { x: e.x, y: e.y },
  ]
}

function slotOutline(e: Extract<Entity, { type: "slot" }>): Point2D[] {
  const { center, length, width, angle } = e
  const halfLen = Math.max(0, length / 2 - width / 2)
  const r = width / 2
  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  const nx = -dy
  const ny = dx

  const c1x = center[0] - halfLen * dx
  const c1y = center[1] - halfLen * dy
  const c2x = center[0] + halfLen * dx
  const c2y = center[1] + halfLen * dy

  const pts: Point2D[] = []
  const arcSegs = Math.max(8, Math.round((Math.PI * r) / 2))

  // Semi-círculo en c1
  for (let i = 0; i <= arcSegs; i++) {
    const a = Math.PI + (Math.PI * i) / arcSegs
    pts.push({
      x: c1x + r * (Math.cos(a) * dx + Math.sin(a) * nx),
      y: c1y + r * (Math.cos(a) * dy + Math.sin(a) * ny),
    })
  }
  // Semi-círculo en c2
  for (let i = 0; i <= arcSegs; i++) {
    const a = (Math.PI * i) / arcSegs
    pts.push({
      x: c2x + r * (Math.cos(a) * dx + Math.sin(a) * nx),
      y: c2y + r * (Math.cos(a) * dy + Math.sin(a) * ny),
    })
  }

  return pts
}

function entityToOutline(e: Entity): PieceOutline | null {
  switch (e.type) {
    case "line":
      return { points: [{ x: e.start[0], y: e.start[1] }, { x: e.end[0], y: e.end[1] }] }
    case "circle":
      return { points: sampleCircle(e.center[0], e.center[1], e.radius) }
    case "arc":
      return {
        points: sampleArc(e.center[0], e.center[1], e.radius, e.startAngle, e.endAngle),
      }
    case "polyline":
      return { points: e.points.map(p => ({ x: p[0], y: p[1] })) }
    case "rectangle":
      return { points: rectCorners(e) }
    case "slot":
      return { points: slotOutline(e) }
    case "ellipse": {
      const pts: Point2D[] = []
      const rad = (e.angle * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      for (let i = 0; i <= SEGMENTS_PER_FULL_CIRCLE; i++) {
        const a = (2 * Math.PI * i) / SEGMENTS_PER_FULL_CIRCLE
        const lx = e.radiusX * Math.cos(a)
        const ly = e.radiusY * Math.sin(a)
        pts.push({
          x: e.center[0] + lx * cos - ly * sin,
          y: e.center[1] + lx * sin + ly * cos,
        })
      }
      return { points: pts }
    }
    case "fold":
      return { points: [{ x: e.start[0], y: e.start[1] }, { x: e.end[0], y: e.end[1] }] }
    case "dimension":
      return { points: [{ x: e.start[0], y: e.start[1] }, { x: e.end[0], y: e.end[1] }] }
    default:
      return null
  }
}

function getLayerTag(e: Entity): string {
  const layer = (e.layer || "").toUpperCase()
  if (layer === "FOLD" || e.type === "fold") return "BEND"
  if (layer === "ETCH" || layer === "TEXT") return "ETCH"
  if (layer === "DIM" || e.type === "dimension") return "DIM"
  return "CUT"
}

export interface PlanGeometryToNestingOptions {
  id?: string
  quantity?: number
  color?: string
  thicknessMm?: number
  name?: string
}

export function planGeometryToNestingPiece(
  geometry: PlanGeometry,
  opts: PlanGeometryToNestingOptions = {},
): NestingPiece {
  const entities = geometry.entities

  // Build sub-entities from all entities
  const subEntities: SubEntity[] = []
  for (const e of entities) {
    const layerTag = getLayerTag(e)
    // Skip bends and dimensions for nesting
    if (layerTag === "BEND" || layerTag === "DIM") continue

    const outline = entityToOutline(e)
    if (!outline || outline.points.length < 2) continue

    const isHole = e.type === "circle" || e.type === "arc" || layerTag === "ETCH"
    subEntities.push({
      outline,
      color: isHole ? "#f97316" : "#22c55e",
      layer: isHole ? "HOLE" : "CUT",
    })
  }

  // Build outer outline from bounding box of all CUT entities
  const allPoints: Point2D[] = []
  for (const e of entities) {
    const layerTag = getLayerTag(e)
    if (layerTag !== "CUT") continue
    const outline = entityToOutline(e)
    if (outline) allPoints.push(...outline.points)
  }

  let outline: PieceOutline
  if (allPoints.length > 0) {
    const b = boundingRect({ points: allPoints })
    outline = {
      points: [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y },
        { x: b.x + b.width, y: b.y + b.height },
        { x: b.x, y: b.y + b.height },
        { x: b.x, y: b.y },
      ],
    }
  } else if (subEntities.length > 0) {
    // Fallback: use bounding box of all sub-entities
    const allSubPoints = subEntities.flatMap(s => s.outline.points)
    const b = boundingRect({ points: allSubPoints })
    outline = {
      points: [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y },
        { x: b.x + b.width, y: b.y + b.height },
        { x: b.x, y: b.y + b.height },
        { x: b.x, y: b.y },
      ],
    }
  } else {
    outline = { points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }] }
  }

  const label = opts.name?.trim() || `ai-part-${Date.now()}`
  const thickness = geometry.dimensions?.thickness ?? opts.thicknessMm

  return {
    id: opts.id ?? `${label}-${Date.now()}`,
    outline,
    subEntities,
    color: opts.color ?? "#22c55e",
    quantity: opts.quantity ?? 1,
    thicknessMm: thickness,
  }
}

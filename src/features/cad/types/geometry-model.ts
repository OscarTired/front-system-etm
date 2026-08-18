/** Mirror del GeometryModel del backend (solo tipos; sin motor local). */

export type Point2D = { x: number; y: number }

export type Line2D = {
  type: "LINE"
  start: Point2D
  end: Point2D
  layer?: string
}

export type Circle2D = {
  type: "CIRCLE"
  center: Point2D
  radius: number
  layer?: string
}

export type Arc2D = {
  type: "ARC"
  center: Point2D
  radius: number
  startAngle: number
  endAngle: number
  layer?: string
}

export type Polyline2D = {
  type: "POLYLINE"
  points: Point2D[]
  closed: boolean
  layer?: string
}

export type GeometryEntity = Line2D | Circle2D | Arc2D | Polyline2D

export type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type GeometryModel = {
  units: "mm"
  entities: GeometryEntity[]
  bounds: BoundingBox
}

export type CadTemplate = "tira" | "malla" | "plate"

export type PlateHolesInput = {
  diameter: number
  offset: number
}

export type CreatePlateBody = {
  template?: "plate"
  width: number
  height: number
  holes?: PlateHolesInput
  thicknessMm?: number
  material?: string
  name?: string
}

export type TiraHolesInput = {
  diameter: number
  insetFromEnd: number
  countPerEnd: 1 | 2
  spacing?: number
}

export type TiraBendsInput = {
  positions: number[]
}

export type CreateTiraBody = {
  template?: "tira"
  length: number
  width: number
  endRadius?: number
  holes?: TiraHolesInput
  bends?: TiraBendsInput
  thicknessMm?: number
  material?: string
  name?: string
}

export type CreateMallaBody = {
  template: "malla"
  width: number
  height: number
  margin: number
  cols: number
  rows: number
  /** Opcional: si no va, el motor calcula el hueco. */
  holeWidth?: number
  holeHeight?: number
  minGap?: number
  gapX?: number
  gapY?: number
  fit?: "auto" | "strict"
  thicknessMm?: number
  material?: string
  name?: string
}

export type CreatePieceBody = CreateTiraBody | CreateMallaBody | CreatePlateBody

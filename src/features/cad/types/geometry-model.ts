/** Mirror del GeometryModel del backend (solo tipos; sin motor local). */

export type Point2D = { x: number; y: number }

export type Line2D = {
  type: "LINE"
  start: Point2D
  end: Point2D
}

export type Circle2D = {
  type: "CIRCLE"
  center: Point2D
  radius: number
}

export type Arc2D = {
  type: "ARC"
  center: Point2D
  radius: number
  startAngle: number
  endAngle: number
}

export type Polyline2D = {
  type: "POLYLINE"
  points: Point2D[]
  closed: boolean
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

export type PlateHolesInput = {
  diameter: number
  offset: number
}

export type CreatePlateBody = {
  width: number
  height: number
  holes?: PlateHolesInput
}

/** Spec plantilla tira (mirror backend). */
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
  length: number
  width: number
  endRadius?: number
  holes?: TiraHolesInput
  bends?: TiraBendsInput
  thicknessMm?: number
  name?: string
}

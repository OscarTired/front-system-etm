export interface Point {
  x: number
  y: number
}

export interface ViewState {
  scale: number
  offsetX: number
  offsetY: number
}

export type Entity =
  | { kind: "line"; a: Point; b: Point; color: string; pieceIndex?: number; layer?: string }
  | { kind: "polyline"; points: Point[]; closed: boolean; color: string; pieceIndex?: number; layer?: string }
  | { kind: "circle"; center: Point; radius: number; color: string; pieceIndex?: number; layer?: string }
  | {
      kind: "arc"
      center: Point
      radius: number
      startAngle: number
      endAngle: number
      color: string
      pieceIndex?: number
      layer?: string
    }
  | { kind: "text"; position: Point; text: string; height: number; color: string; pieceIndex?: number; layer?: string }

export interface NestingPieceInput {
  /** Puntos del contorno de cada sub-trazo, con color y capa originales. */
  subOutlines: { points: Point[]; color?: string; layer?: string }[]
  /** Contorno fusionado — respaldo de hit-test si no hay subOutlines. */
  outline?: Point[]
  angle?: number
}

export interface LayerInfo {
  key: string
  label: string
  color: string
  count: number
}

export interface ToolpathSeg {
  points: Point[]
  startLen: number
  endLen: number
}

export type MeasureTool = "none" | "distance" | "radius" | "angle" | "area" | "coords"

export type CanvasTool = "select" | "pan" | "zoomWindow" | "rotate"

export type Measurement =
  | { id: string; kind: "distance"; a: Point; b: Point; value: number }
  | { id: string; kind: "radius"; center: Point; radius: number; anglePoint: Point }
  | { id: string; kind: "angle"; vertex: Point; p1: Point; p2: Point; degrees: number }
  | { id: string; kind: "area"; points: Point[]; area: number; perimeter: number; centroid: Point }

export interface SnapCandidate {
  point: Point
  type: "endpoint" | "midpoint" | "center"
}

/** Libre = arrastre continuo; Geométrico = ejes + rotación en pasos fijos. */
export type TransformMode = "free" | "geometric"

export type RotationStep = 15 | 45 | 90 | 180

export interface DxfCanvasProps {
  pieces: NestingPieceInput[]
  sheetSize?: { width: number; height: number }
  selectedPieceIndices?: number[]
  onSelectPiece?: (index: number | null, additive: boolean) => void
  hiddenKeys?: string[]
  collidingPieceIndices?: number[]
  /** Piezas bloqueadas: no inician arrastre. */
  lockedPieceIndices?: number[]
  onMovePieces?: (pieceIndices: number[], dx: number, dy: number) => void
  onRotateSelected?: (pieceIndices: number[], degrees: number) => void
  /** Rotar selección alrededor de un pivot en coords de plancha (grados). */
  onRotateAroundPivot?: (
    pieceIndices: number[],
    pivot: { x: number; y: number },
    degrees: number,
  ) => void
  /** Eliminar piezas seleccionadas de la plancha. */
  onDeleteSelected?: (pieceIndices: number[]) => void
  /** Eliminar de plancha + listado del proyecto (opcional). */
  onDeleteFromProject?: (pieceIndices: number[]) => void
  /** Modo de transformación manual en plancha. Default: free. */
  transformMode?: TransformMode
  onTransformModeChange?: (mode: TransformMode) => void
  /** Paso angular en modo geométrico (grados). Default: 90. */
  rotationStep?: RotationStep
  onRotationStepChange?: (step: RotationStep) => void
}

/** Offset temporal mientras se arrastran piezas (preview en vivo). */
export interface PieceDragPreview {
  indices: number[]
  dx: number
  dy: number
}

export const SHEET_STROKE = "#71717a"
export const SELECTED_STROKE = "#ffffff"
export const SELECTED_HALO = "#facc15"
export const COLLISION_COLOR = "#ef4444"
export const MEASURE_COLOR = "#22d3ee"
export const MEASURE_PENDING_COLOR = "#67e8f9"

export const HIT_TOLERANCE_PX = 10
export const SNAP_TOLERANCE_PX = 12

export const TOOL_LABELS: Record<Exclude<MeasureTool, "none">, string> = {
  distance: "Distancia",
  radius: "Radio / diámetro",
  angle: "Ángulo",
  area: "Área / perímetro",
  coords: "Coordenadas",
}

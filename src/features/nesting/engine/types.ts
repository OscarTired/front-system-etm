/**
 * Tipos del dominio nesting (shared shape con el backend).
 * El algoritmo optimize vive en POST /engineering/nest — no en el browser.
 * geometry / polygon-collision aquí solo sirven UI (drag, export, preview).
 */

export interface Point2D {
  x: number
  y: number
}

/** Rectángulo alineado a los ejes (bounding box). */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Contorno de una pieza: lista de puntos que forman su silueta. */
export interface PieceOutline {
  points: Point2D[]
}

/**
 * Un trazo individual con su color real clasificado (ej. corte vs doblez/marca)
 * y su capa original del CAD de origen.
 */
export interface SubEntity {
  outline: PieceOutline
  color?: string
  /** Nombre de capa original del DXF/GEO (grupo 8 en DXF). */
  layer?: string
}

/** Pieza de entrada para el nesting. */
export interface NestingPiece {
  id: string
  /** Contorno fusionado — SOLO para bounding box/colisión. */
  outline: PieceOutline
  /** Trazos individuales reales (contorno + huecos). */
  subEntities?: SubEntity[]
  color?: string
  quantity?: number
  thicknessMm?: number
}

/** Pieza ya colocada en una plancha. */
export interface PlacedPiece {
  pieceId: string
  x: number
  y: number
  /** Grados: 0, 90, 180 o 270. */
  angle: number
  outline: PieceOutline
  subEntities?: SubEntity[]
  color?: string
}

/** Una plancha con sus piezas ya acomodadas. */
export interface NestedSheet {
  pieces: PlacedPiece[]
  thicknessMm?: number
}

export type NestingMode = "fast" | "precise"

export interface SheetConfig {
  width: number
  height: number
  margin: number
}

export type RotationMode = "0-90-180-270" | "libre" | "ninguna"

export interface NestingOptions {
  sheet: SheetConfig
  mode?: NestingMode
  separation?: number
  rotationMode?: RotationMode
  searchStep?: number
  onProgress?: (progress: number) => void
  signal?: { cancelled: boolean }
}

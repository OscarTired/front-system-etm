export interface Nomenclatura {
  anio: string
  proyecto: string
  lote: string
  material: string
  espesor: string
}

/**
 * Puerto de la cadena base de Exporter::exportarProyecto:
 * "PRY{año}-{proyecto}_L{lote}_{material}_{espesor}"
 * ej: PRY26-085_L5_LAF_1.5
 */
export function buildBaseName(nom: Nomenclatura): string {
  return `PRY${nom.anio}-${nom.proyecto}_L${nom.lote}_${nom.material}_${nom.espesor}`
}

/**
 * Puerto del nombre de archivo por plancha:
 * "{base}_Q{cantidadPiezas}_R01_P{indice de 2 dígitos}"
 * ej: PRY26-085_L5_LAF_1.5_Q19_R01_P01
 */
export function buildSheetFileName(
  nom: Nomenclatura,
  pieceCountOnSheet: number,
  sheetIndex: number // 0-based
): string {
  const base = buildBaseName(nom)
  const sheetNumber = String(sheetIndex + 1).padStart(2, "0")
  return `${base}_Q${pieceCountOnSheet}_R01_P${sheetNumber}`
}

/**
 * Puerto del nombre del reporte PDF maestro (usa el total de piezas de
 * TODAS las planchas, no de una sola):
 * "{base}_Q{totalPiezas}_R01"
 */
export function buildProjectReportName(nom: Nomenclatura, totalPieceCount: number): string {
  return `${buildBaseName(nom)}_Q${totalPieceCount}_R01`
}

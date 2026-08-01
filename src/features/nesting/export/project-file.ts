import type { PieceOutline, SheetConfig, SubEntity } from "../engine/types"
import type { MaterialData } from "../cad/thickness-scanner"

export interface ProjectPieceEntry {
  id: string
  source: "manual" | "cad"
  fileName?: string
  width: number
  height: number
  quantity: number
  color: string
  outline: PieceOutline
  subEntities?: SubEntity[]
  material?: MaterialData
}

export interface ProjectFile {
  /** Para poder evolucionar el formato sin romper proyectos guardados con una versión anterior. */
  formatVersion: 1
  sheet: SheetConfig
  pieces: ProjectPieceEntry[]
}

export function serializeProject(project: Omit<ProjectFile, "formatVersion">): string {
  const file: ProjectFile = { formatVersion: 1, ...project }
  return JSON.stringify(file, null, 2)
}

export class ProjectFileParseError extends Error {}

/**
 * Puerto adaptado de ProjectManager::abrirProyecto. Valida la
 * estructura mínima antes de aceptar el archivo — un proyecto
 * corrupto/de otra versión no debe tirar una excepción críptica de
 * JSON.parse ni, peor, cargar datos a medias silenciosamente.
 */
export function parseProjectFile(json: string): ProjectFile {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new ProjectFileParseError("El archivo no es un JSON válido.")
  }

  if (typeof raw !== "object" || raw === null) {
    throw new ProjectFileParseError("El archivo de proyecto está vacío o mal formado.")
  }

  const obj = raw as Record<string, unknown>

  if (obj.formatVersion !== 1) {
    throw new ProjectFileParseError(
      `Versión de proyecto no soportada (${String(obj.formatVersion)}). Esta versión de Nesting solo lee formatVersion=1.`
    )
  }

  if (typeof obj.sheet !== "object" || obj.sheet === null) {
    throw new ProjectFileParseError("El archivo de proyecto no tiene configuración de plancha (`sheet`).")
  }

  if (!Array.isArray(obj.pieces)) {
    throw new ProjectFileParseError("El archivo de proyecto no tiene una lista de piezas (`pieces`) válida.")
  }

  return raw as ProjectFile
}

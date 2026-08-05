import type { NestedSheet, PieceOutline, SheetConfig, SubEntity } from "../engine/types"
import type { MaterialData } from "../cad/thickness-scanner"
import type { ProjectSettings, MachineSettings } from "../types/project-settings"
import type { SheetEditSnapshot } from "./nesting-session"

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

export interface ProjectFileV1 {
  formatVersion: 1
  sheet: SheetConfig
  pieces: ProjectPieceEntry[]
}

export interface ProjectFileV2 {
  formatVersion: 2
  name?: string
  savedAt?: string
  sheet: SheetConfig
  settings: ProjectSettings
  machine: MachineSettings
  pieces: ProjectPieceEntry[]
  rows?: ProjectPieceEntry[]
  sheets: NestedSheet[] | null
  activeGroupIndex: number
  editsBySheet: Record<string, SheetEditSnapshot>
}

export type ProjectFile = ProjectFileV1 | ProjectFileV2

export function isProjectFileV2(p: ProjectFile): p is ProjectFileV2 {
  return p.formatVersion === 2
}

export function serializeProjectV2(
  project: Omit<ProjectFileV2, "formatVersion" | "savedAt"> & { savedAt?: string },
): string {
  const file: ProjectFileV2 = {
    formatVersion: 2,
    savedAt: project.savedAt ?? new Date().toISOString(),
    name: project.name,
    sheet: project.sheet,
    settings: project.settings,
    machine: project.machine,
    pieces: project.pieces,
    rows: project.rows ?? project.pieces,
    sheets: project.sheets,
    activeGroupIndex: project.activeGroupIndex,
    editsBySheet: project.editsBySheet ?? {},
  }
  return JSON.stringify(file, null, 2)
}

/** @deprecated usar serializeProjectV2 */
export function serializeProject(project: Omit<ProjectFileV1, "formatVersion">): string {
  const file: ProjectFileV1 = { formatVersion: 1, ...project }
  return JSON.stringify(file, null, 2)
}

export class ProjectFileParseError extends Error {}

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
  const version = obj.formatVersion

  if (version === 2) {
    if (typeof obj.sheet !== "object" || obj.sheet === null) {
      throw new ProjectFileParseError("Proyecto v2 sin configuración de plancha (`sheet`).")
    }
    if (!Array.isArray(obj.pieces) && !Array.isArray(obj.rows)) {
      throw new ProjectFileParseError("Proyecto v2 sin lista de piezas (`pieces` / `rows`).")
    }
    return raw as ProjectFileV2
  }

  if (version === 1) {
    if (typeof obj.sheet !== "object" || obj.sheet === null) {
      throw new ProjectFileParseError("El archivo de proyecto no tiene configuración de plancha (`sheet`).")
    }
    if (!Array.isArray(obj.pieces)) {
      throw new ProjectFileParseError("El archivo de proyecto no tiene una lista de piezas (`pieces`) válida.")
    }
    return raw as ProjectFileV1
  }

  throw new ProjectFileParseError(
    `Versión de proyecto no soportada (${String(version)}). Se aceptan formatVersion 1 y 2.`,
  )
}

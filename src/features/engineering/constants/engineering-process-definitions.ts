import type { EntityIcon } from "@/shared/constants/entity-icons"

/**
 * Columnas del carrusel de Ingeniería.
 * Codes alineados al seed de Stage (proyecto), sin PRODUCTION/WIRING/COMPLETED.
 * El stage del proyecto NO bloquea crear/asignar en estas columnas.
 */
export type EngineeringProcessCode =
  | "MECHANICAL_DESIGN"
  | "ELECTRICAL_DESIGN"
  | "MECHANICAL_PLAN"
  | "ELECTRICAL_PLAN"
  | "LM_GEOS"
  | "CAM"
  | "BENDING"
  | "WELDING"
  | "PROCUREMENT"

export type EngineeringProcessDefinition = {
  code: EngineeringProcessCode
  /** Código corto UI (badge) */
  short: string
  label: string
  icon: EntityIcon
  color: string
}

export const ENGINEERING_PROCESS_ORDER: EngineeringProcessCode[] = [
  "MECHANICAL_DESIGN",
  "ELECTRICAL_DESIGN",
  "MECHANICAL_PLAN",
  "ELECTRICAL_PLAN",
  "LM_GEOS",
  "CAM",
  "BENDING",
  "WELDING",
  "PROCUREMENT",
]

export const ENGINEERING_PROCESS_DEFINITIONS: Record<
  EngineeringProcessCode,
  EngineeringProcessDefinition
> = {
  MECHANICAL_DESIGN: {
    code: "MECHANICAL_DESIGN",
    short: "DM",
    label: "D - Mecánico",
    icon: "pencil",
    color: "#2563EB",
  },
  ELECTRICAL_DESIGN: {
    code: "ELECTRICAL_DESIGN",
    short: "DE",
    label: "D - Eléctrico",
    icon: "bolt",
    color: "#EAB308",
  },
  MECHANICAL_PLAN: {
    code: "MECHANICAL_PLAN",
    short: "PM",
    label: "P - Mecánico",
    icon: "drafting",
    color: "#3B82F6",
  },
  ELECTRICAL_PLAN: {
    code: "ELECTRICAL_PLAN",
    short: "PE",
    label: "P - Eléctrico",
    icon: "drafting",
    color: "#FACC15",
  },
  LM_GEOS: {
    code: "LM_GEOS",
    short: "LM",
    label: "LM y Geos",
    icon: "measure",
    color: "#64748B",
  },
  CAM: {
    code: "CAM",
    short: "CAM",
    label: "CAM",
    icon: "cog",
    color: "#0EA5E9",
  },
  BENDING: {
    code: "BENDING",
    short: "DOB",
    label: "P - Doblez",
    icon: "fold",
    color: "#F97316",
  },
  WELDING: {
    code: "WELDING",
    short: "SOL",
    label: "P - Soldadura",
    icon: "flame",
    color: "#EF4444",
  },
  PROCUREMENT: {
    code: "PROCUREMENT",
    short: "LP",
    label: "Lista Procura",
    icon: "boxes",
    color: "#10B981",
  },
}

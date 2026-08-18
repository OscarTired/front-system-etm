/**
 * Columnas del carrusel de Ingeniería.
 * Codes alineados al seed de Stage (proyecto).
 * Color / nombre / icono: catálogo stages (backend) vía useEngineeringProcessCatalog.
 * NO hardcodear color aquí — el back es la fuente de verdad.
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

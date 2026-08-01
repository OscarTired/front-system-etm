export interface ProjectSettings {
  proyecto: string
  cliente: string
  material: string
  espesor: string
  sheetWidth: string
  sheetHeight: string
  margin: string
  /** mm — distancia de la muesca/lead-in de perforación. UI only por ahora, no cableado al motor. */
  muesca: string
  /** mm — separación mínima entre piezas, distinta del margen (que es borde de plancha). UI only por ahora. */
  separacion: string
  rotacionPermitida: "0-90-180-270" | "libre" | "ninguna"
  prioridad: "normal" | "alta" | "baja"
}

export function defaultProjectSettings(): ProjectSettings {
  return {
    proyecto: "",
    cliente: "",
    material: "",
    espesor: "",
    sheetWidth: "2045",
    sheetHeight: "1205",
    margin: "3",
    muesca: "0",
    separacion: "0",
    rotacionPermitida: "0-90-180-270",
    prioridad: "normal",
  }
}

export interface MachineSettings {
  maquina: string
  gas: string
  boquilla: string
}

export function defaultMachineSettings(): MachineSettings {
  return { maquina: "", gas: "", boquilla: "" }
}
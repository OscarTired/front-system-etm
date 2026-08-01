export interface MaterialData {
  /** mm. -1 si no se detectó. */
  thickness: number
  /** Norma DIN o material (ej. "DC01", "AISI304"). "N/D" si no se detectó. */
  dinNorm: string
  /** Aleación específica (solo disponible en .geo). "N/D" si no se detectó. */
  alloy: string
}

function emptyMaterialData(): MaterialData {
  return { thickness: -1, dinNorm: "N/D", alloy: "N/D" }
}

export function isValidMaterialData(data: MaterialData): boolean {
  return data.thickness > 0
}

/**
 * Puerto de ThicknessScanner::scanDxf. Busca tags de texto embebidos
 * por el CAD de origen (convención SPI): `SPI-THICKNESS<numero>` para
 * el espesor y `SPI-BL-AT-MAT:<texto>` para el material/norma. Corta
 * la búsqueda apenas encuentra ambos datos, igual que el original.
 */
function scanDxfThickness(content: string): MaterialData {
  const data = emptyMaterialData()
  const lines = content.split(/\r\n|\r|\n/)

  const thicknessRe = /SPI-THICKNESS([0-9]*\.?[0-9]+)/
  const materialRe = /SPI-BL-AT-MAT:(.+)/

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (data.thickness < 0) {
      const m = thicknessRe.exec(line)
      if (m) data.thickness = parseFloat(m[1])
    }

    if (data.dinNorm === "N/D") {
      const m = materialRe.exec(line)
      if (m) data.dinNorm = m[1].trim()
    }

    if (data.thickness > 0 && data.dinNorm !== "N/D") break
  }

  return data
}

/**
 * Puerto de ThicknessScanner::scanGeo. El espesor vive en el bloque
 * `#~11` (primer número positivo encontrado ahí — se ignora cualquier
 * dato técnico adicional una vez capturado, igual que el original). El
 * material/aleación vive en el bloque `#~30`, en líneas `WERKSTOFF@` y
 * `MAT@`.
 */
function scanGeoThickness(content: string): MaterialData {
  const data = emptyMaterialData()
  const lines = content.split(/\r\n|\r|\n/).map((l) => l.trim())

  let inBlock11 = false
  let inBlock30 = false

  for (const line of lines) {
    if (line === "#~11") {
      inBlock11 = true
      continue
    }
    if (inBlock11 && line === "##~~") {
      inBlock11 = false
      continue
    }
    if (inBlock11 && data.thickness < 0) {
      const val = parseFloat(line)
      if (!Number.isNaN(val) && val > 0) data.thickness = val
    }

    if (line === "#~30") {
      inBlock30 = true
      continue
    }
    if (inBlock30 && line === "##~~") {
      inBlock30 = false
      continue
    }
    if (inBlock30) {
      if (line.startsWith("WERKSTOFF@")) {
        data.dinNorm = line.slice("WERKSTOFF@".length).trim()
      } else if (line.startsWith("MAT@")) {
        data.alloy = line.slice("MAT@".length).trim()
      }
    }
  }

  return data
}

/**
 * Puerto de ThicknessScanner::scanData: enruta según la extensión del
 * archivo. Devuelve un MaterialData "inválido" (thickness=-1) si el
 * formato no está soportado o no se detectó nada.
 */
export function scanMaterialData(fileName: string, content: string): MaterialData {
  const ext = fileName.toLowerCase().split(".").pop() ?? ""

  if (ext === "geo") return scanGeoThickness(content)
  if (ext === "dxf") return scanDxfThickness(content)

  return emptyMaterialData()
}

import { parseDxf } from "./dxf-parser"
import { parseGeo } from "./geo-parser"
import { emptyCadData, type CadData } from "./types"

/**
 * Lee un archivo CAD (contenido ya como texto) y enruta al parser
 * correcto según la extensión. Equivalente a CadReader::leerArchivo.
 *
 * PDF no está soportado: el original tampoco lo parsea de verdad — usa
 * Inkscape.exe como proceso externo para convertirlo a DXF primero, algo
 * que no aplica a una arquitectura web sin repensar el approach.
 */
export function readCadFile(fileName: string, fileContent: string): CadData {
  const ext = fileName.toLowerCase().split(".").pop() ?? ""

  switch (ext) {
    case "dxf":
      return parseDxf(fileContent)
    case "geo":
      return parseGeo(fileContent)
    default:
      return emptyCadData()
  }
}

export function isSupportedCadFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop() ?? ""
  return ext === "dxf" || ext === "geo"
}

export * from "./types"
export { parseDxf } from "./dxf-parser"
export { parseGeo } from "./geo-parser"

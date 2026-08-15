/** Extensiones CAD soportadas por POST /engineering/cad/parse (sin parsers locales). */

export function isSupportedCadFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop() ?? ""
  return ext === "dxf" || ext === "geo"
}

export function isPdfFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf")
}

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

/** Espesores de chapa habituales (mm) — priorizan el parser GEO. */
const COMMON_THICKNESSES = [
  0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.25, 1.5, 1.6, 1.8, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30,
]

function isPlausibleThickness(v: number): boolean {
  if (!(v >= 0.2 && v <= 50)) return false
  return true
}

function pickBestThickness(candidates: number[]): number {
  const ok = candidates.filter(isPlausibleThickness)
  if (ok.length === 0) return -1

  // 1) Exact match con stock habitual (prioridad)
  const stockHits: number[] = []
  for (const c of ok) {
    for (const stock of COMMON_THICKNESSES) {
      if (Math.abs(c - stock) < 0.051) {
        stockHits.push(stock)
        break
      }
    }
  }
  if (stockHits.length > 0) {
    // Si hay varios stock matches, el más frecuente en candidates
    const counts = new Map<number, number>()
    for (const s of stockHits) counts.set(s, (counts.get(s) ?? 0) + 1)
    let best = stockHits[0]
    let bestN = 0
    for (const [s, n] of counts) {
      if (n > bestN) {
        best = s
        bestN = n
      }
    }
    return best
  }

  // 2) Valores con decimales (típicos de espesor real)
  const withDecimals = ok.filter((v) => Math.abs(v - Math.round(v)) > 1e-6)
  if (withDecimals.length === 1) return withDecimals[0]
  if (withDecimals.length > 1) return Math.min(...withDecimals)

  // 3) Evitar 1 suelto si hay alternativas ≥ 1.2 (1 suele ser contador en #~11)
  const withoutOne = ok.filter((v) => Math.abs(v - 1) > 0.05)
  if (withoutOne.length > 0) return Math.min(...withoutOne)

  return Math.min(...ok)
}

function scanDxfThickness(content: string): MaterialData {
  const data = emptyMaterialData()
  const lines = content.split(/\r\n|\r|\n/)

  const thicknessRe = /SPI-THICKNESS([0-9]*\.?[0-9]+)/
  const materialRe = /SPI-BL-AT-MAT:(.+)/

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (data.thickness < 0) {
      const m = thicknessRe.exec(line)
      if (m) {
        const v = parseFloat(m[1])
        if (isPlausibleThickness(v)) data.thickness = v
      }
    }

    if (data.dinNorm === "N/D") {
      const m = materialRe.exec(line)
      if (m) data.dinNorm = m[1].trim()
    }

    if (data.thickness > 0 && data.dinNorm !== "N/D") break
  }

  return data
}

function scanGeoThickness(content: string): MaterialData {
  const data = emptyMaterialData()
  const lines = content.split(/\r\n|\r|\n/).map((l) => l.trim())

  let inBlock11 = false
  let inBlock30 = false
  const thicknessCandidates: number[] = []

  for (const line of lines) {
    if (line === "#~11") {
      inBlock11 = true
      continue
    }
    if (inBlock11 && (line === "##~~" || line.startsWith("#~"))) {
      inBlock11 = false
      if (line.startsWith("#~") && line !== "#~11") {
        if (line === "#~30") inBlock30 = true
      }
      continue
    }
    if (inBlock11) {
      if (/^[0-9]+([.,][0-9]+)?$/.test(line)) {
        const val = parseFloat(line.replace(",", "."))
        if (!Number.isNaN(val) && val > 0) thicknessCandidates.push(val)
      }
      continue
    }

    if (line === "#~30") {
      inBlock30 = true
      continue
    }
    if (inBlock30 && (line === "##~~" || (line.startsWith("#~") && line !== "#~30"))) {
      inBlock30 = false
      continue
    }
    if (inBlock30) {
      if (line.startsWith("WERKSTOFF@")) {
        const v = line.slice("WERKSTOFF@".length).trim()
        if (v) data.dinNorm = v
      } else if (line.startsWith("MAT@")) {
        const v = line.slice("MAT@".length).trim()
        if (v) data.alloy = v
      }
    }
  }

  data.thickness = pickBestThickness(thicknessCandidates)
  return data
}

export function scanMaterialData(fileName: string, content: string): MaterialData {
  const ext = fileName.toLowerCase().split(".").pop() ?? ""

  if (ext === "geo") return scanGeoThickness(content)
  if (ext === "dxf") return scanDxfThickness(content)

  return emptyMaterialData()
}

export function thicknessGroupKey(thickness: number): string {
  if (!(thickness > 0)) return "sin-espesor"
  return (Math.round(thickness * 100) / 100).toFixed(2)
}

export function formatThicknessLabel(thickness: number | undefined | null): string {
  if (thickness == null || !(thickness > 0)) return "s/esp."
  const t = Math.round(thickness * 100) / 100
  return Number.isInteger(t) ? `${t} mm` : `${t} mm`
}
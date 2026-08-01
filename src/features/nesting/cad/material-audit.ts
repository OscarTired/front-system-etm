import type { MaterialData } from "./thickness-scanner"

export interface AuditablePiece {
  id: string
  material: MaterialData
  /** Si el usuario ya revisó y descartó el conflicto para esta pieza a mano. */
  forgiven?: boolean
}

export interface AuditResult {
  id: string
  thicknessConflict: boolean
  dinConflict: boolean
  alloyConflict: boolean
  hasConflict: boolean
}

export interface MaterialAuditSummary {
  /** Espesor objetivo del grupo (el de la primera pieza válida, o el que se pase explícito). */
  targetThickness: number
  /** DIN/material más frecuente entre las piezas con dato detectado. */
  majorityDin: string
  /** Aleación más frecuente entre las piezas con dato detectado. */
  majorityAlloy: string
  results: AuditResult[]
  /** true si al menos una pieza tiene conflicto sin perdonar. */
  hasAnyConflict: boolean
}

const THICKNESS_TOLERANCE_MM = 0.01

function pickMajority(values: string[]): string {
  const counts = new Map<string, number>()
  let majority = "N/D"
  let maxCount = 0

  for (const v of values) {
    if (v === "N/D" || v === "") continue
    const next = (counts.get(v) ?? 0) + 1
    counts.set(v, next)
    if (next > maxCount) {
      maxCount = next
      majority = v
    }
  }

  return majority
}

/**
 * Puerto de AuditorMaterialesDialog::cargarDatos. Compara el espesor,
 * norma DIN/material y aleación de cada pieza contra el "consenso" del
 * grupo (el valor más frecuente entre todas), y marca cualquier pieza
 * que se desvíe — evita que se nesteen sin querer piezas de distinto
 * material/espesor en la misma tanda de corte físico.
 *
 * `targetThickness` es opcional: si no se pasa, se usa el espesor de
 * la primera pieza con dato válido (igual de flexible que dejar que el
 * operador la fije a mano en el original).
 */
export function auditMaterials(
  pieces: AuditablePiece[],
  targetThickness?: number
): MaterialAuditSummary {
  const majorityDin = pickMajority(pieces.map((p) => p.material.dinNorm))
  const majorityAlloy = pickMajority(pieces.map((p) => p.material.alloy))

  const resolvedTarget =
    targetThickness ?? pieces.find((p) => p.material.thickness > 0)?.material.thickness ?? -1

  const results: AuditResult[] = pieces.map((p) => {
    if (p.forgiven) {
      return { id: p.id, thicknessConflict: false, dinConflict: false, alloyConflict: false, hasConflict: false }
    }

    const thicknessConflict =
      resolvedTarget > 0 && Math.abs(p.material.thickness - resolvedTarget) > THICKNESS_TOLERANCE_MM

    const din = p.material.dinNorm === "N/D" ? "" : p.material.dinNorm
    const dinConflict = majorityDin !== "N/D" && din !== "" && din !== majorityDin

    const alloy = p.material.alloy === "N/D" ? "" : p.material.alloy
    const alloyConflict = majorityAlloy !== "N/D" && alloy !== "" && alloy !== majorityAlloy

    return {
      id: p.id,
      thicknessConflict,
      dinConflict,
      alloyConflict,
      hasConflict: thicknessConflict || dinConflict || alloyConflict,
    }
  })

  return {
    targetThickness: resolvedTarget,
    majorityDin,
    majorityAlloy,
    results,
    hasAnyConflict: results.some((r) => r.hasConflict),
  }
}

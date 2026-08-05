import type { MaterialData } from "./thickness-scanner"
import { thicknessGroupKey } from "./thickness-scanner"

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
  /** Motivo corto para tooltip / UI. */
  reason?: string
}

export interface MaterialAuditSummary {
  targetThickness: number
  majorityDin: string
  majorityAlloy: string
  results: AuditResult[]
  hasAnyConflict: boolean
}

const THICKNESS_TOLERANCE_MM = 0.05

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

function majorityThickness(pieces: AuditablePiece[]): number {
  const counts = new Map<string, { n: number; v: number }>()
  for (const p of pieces) {
    if (!(p.material.thickness > 0)) continue
    const k = thicknessGroupKey(p.material.thickness)
    const cur = counts.get(k)
    if (cur) cur.n++
    else counts.set(k, { n: 1, v: p.material.thickness })
  }
  let best: { n: number; v: number } | null = null
  for (const c of counts.values()) {
    if (!best || c.n > best.n) best = c
  }
  return best?.v ?? -1
}

/**
 * Auditoría de material **por grupo de espesor**.
 *
 * Antes: se tomaba el espesor de la *primera* pieza y todo lo demás
 * (1.5 vs 2 mm) salía en naranja — falso positivo, porque el nest ya
 * separa planchas por espesor.
 *
 * Ahora:
 * - Diferente espesor → NO es conflicto (se nestearán en buckets distintos).
 * - Dentro del mismo espesor → conflicto si DIN o aleación difieren del
 *   consenso de ese grupo (mezclar 1.4301 con DC01 en la misma chapa).
 */
export function auditMaterials(
  pieces: AuditablePiece[],
  _targetThickness?: number
): MaterialAuditSummary {
  const withThickness = pieces.filter((p) => p.material.thickness > 0)
  const globalMajorityDin = pickMajority(pieces.map((p) => p.material.dinNorm))
  const globalMajorityAlloy = pickMajority(pieces.map((p) => p.material.alloy))
  const majorityTh = majorityThickness(withThickness)

  // Agrupar por espesor para consenso local de DIN/aleación
  const byTh = new Map<string, AuditablePiece[]>()
  for (const p of withThickness) {
    const k = thicknessGroupKey(p.material.thickness)
    if (!byTh.has(k)) byTh.set(k, [])
    byTh.get(k)!.push(p)
  }

  const localMajority = new Map<string, { din: string; alloy: string }>()
  for (const [k, group] of byTh) {
    localMajority.set(k, {
      din: pickMajority(group.map((p) => p.material.dinNorm)),
      alloy: pickMajority(group.map((p) => p.material.alloy)),
    })
  }

  const results: AuditResult[] = pieces.map((p) => {
    if (p.forgiven) {
      return {
        id: p.id,
        thicknessConflict: false,
        dinConflict: false,
        alloyConflict: false,
        hasConflict: false,
      }
    }

    // Sin espesor detectado: no marcar conflicto de material
    // (DXF sin SPI-THICKNESS, etc.) — irán a bucket "sin-espesor".
    if (!(p.material.thickness > 0)) {
      return {
        id: p.id,
        thicknessConflict: false,
        dinConflict: false,
        alloyConflict: false,
        hasConflict: false,
      }
    }

    const k = thicknessGroupKey(p.material.thickness)
    const local = localMajority.get(k) ?? {
      din: globalMajorityDin,
      alloy: globalMajorityAlloy,
    }

    const dinConflict =
      local.din !== "N/D" &&
      p.material.dinNorm !== "N/D" &&
      p.material.dinNorm !== local.din

    const alloyConflict =
      local.alloy !== "N/D" &&
      p.material.alloy !== "N/D" &&
      p.material.alloy !== local.alloy

    // Espesor distinto del mayoritario: informativo, no bloquea ni pinta
    // naranja (el motor ya separa planchas).
    const thicknessConflict = false

    const hasConflict = dinConflict || alloyConflict
    let reason: string | undefined
    if (dinConflict) reason = `DIN ${p.material.dinNorm} ≠ ${local.din}`
    else if (alloyConflict) reason = `Aleación ${p.material.alloy} ≠ ${local.alloy}`

    return {
      id: p.id,
      thicknessConflict,
      dinConflict,
      alloyConflict,
      hasConflict,
      reason,
    }
  })

  return {
    targetThickness: majorityTh,
    majorityDin: globalMajorityDin,
    majorityAlloy: globalMajorityAlloy,
    results,
    hasAnyConflict: results.some((r) => r.hasConflict),
  }
}

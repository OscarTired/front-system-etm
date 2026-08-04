import type { Entity, Point, SnapCandidate } from "../types/types"
import { SNAP_TOLERANCE_PX } from "../types/types"

/** Extremos, medios y centros de todas las entidades visibles. */
export function computeSnapCandidates(entities: Entity[]): SnapCandidate[] {
  const out: SnapCandidate[] = []
  for (const e of entities) {
    if (e.kind === "line") {
      out.push({ point: e.a, type: "endpoint" })
      out.push({ point: e.b, type: "endpoint" })
      out.push({
        point: { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 },
        type: "midpoint",
      })
    } else if (e.kind === "polyline") {
      for (let i = 0; i < e.points.length; i++) {
        out.push({ point: e.points[i], type: "endpoint" })
        const next = e.points[i + 1] ?? (e.closed ? e.points[0] : null)
        if (next) {
          out.push({
            point: { x: (e.points[i].x + next.x) / 2, y: (e.points[i].y + next.y) / 2 },
            type: "midpoint",
          })
        }
      }
    } else if (e.kind === "circle" || e.kind === "arc") {
      out.push({ point: e.center, type: "center" })
    }
  }
  return out
}

export function findNearestSnap(
  entities: Entity[],
  point: Point,
  scale: number
): SnapCandidate | null {
  const tol = SNAP_TOLERANCE_PX / scale
  let best: SnapCandidate | null = null
  let bestDist = tol
  for (const c of computeSnapCandidates(entities)) {
    const d = Math.hypot(point.x - c.point.x, point.y - c.point.y)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best
}

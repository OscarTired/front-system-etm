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


/** Proyección al segmento más cercano (para regla inteligente punta↔línea). */
export function findNearestEdgeSnap(
  entities: Entity[],
  point: Point,
  scale: number,
): SnapCandidate | null {
  const tol = (SNAP_TOLERANCE_PX * 1.5) / scale
  let best: SnapCandidate | null = null
  let bestDist = tol

  const considerSeg = (a: Point, b: Point) => {
    const vx = b.x - a.x
    const vy = b.y - a.y
    const len2 = vx * vx + vy * vy
    if (len2 < 1e-18) return
    let t = ((point.x - a.x) * vx + (point.y - a.y) * vy) / len2
    t = Math.max(0, Math.min(1, t))
    const proj = { x: a.x + t * vx, y: a.y + t * vy }
    const d = Math.hypot(point.x - proj.x, point.y - proj.y)
    if (d < bestDist) {
      bestDist = d
      // endpoint si está casi en extremo, si no midpoint como "sobre arista"
      const type =
        t < 0.02 || t > 0.98 ? "endpoint" : ("midpoint" as const)
      best = { point: proj, type }
    }
  }

  for (const e of entities) {
    if (e.kind === "line") {
      considerSeg(e.a, e.b)
    } else if (e.kind === "polyline") {
      for (let i = 0; i < e.points.length - 1; i++) {
        considerSeg(e.points[i], e.points[i + 1])
      }
      if (e.closed && e.points.length > 2) {
        considerSeg(e.points[e.points.length - 1], e.points[0])
      }
    }
  }
  return best
}

/** Snap compuesto: extremos/centros primero, si no hay, proyección a arista. */
export function findSmartSnap(
  entities: Entity[],
  point: Point,
  scale: number,
): SnapCandidate | null {
  return findNearestSnap(entities, point, scale) ?? findNearestEdgeSnap(entities, point, scale)
}

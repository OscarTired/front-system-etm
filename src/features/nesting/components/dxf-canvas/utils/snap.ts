import type { Entity, Point, SnapCandidate } from "../types/types"
import { SNAP_TOLERANCE_PX } from "../types/types"

/** Extremos, medios y centros de todas las entidades visibles. */
export function computeSnapCandidates(entities: Entity[]): SnapCandidate[] {
  const out: SnapCandidate[] = []
  for (const e of entities) {
    if (e.kind === "line") {
      out.push({ point: e.a, type: "endpoint", segment: { a: e.a, b: e.b } })
      out.push({ point: e.b, type: "endpoint", segment: { a: e.a, b: e.b } })
      out.push({
        point: { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 },
        type: "midpoint",
        segment: { a: e.a, b: e.b },
      })
    } else if (e.kind === "polyline") {
      for (let i = 0; i < e.points.length; i++) {
        const next = e.points[i + 1] ?? (e.closed ? e.points[0] : null)
        out.push({
          point: e.points[i],
          type: "endpoint",
          segment: next ? { a: e.points[i], b: next } : undefined,
        })
        if (next) {
          out.push({
            point: { x: (e.points[i].x + next.x) / 2, y: (e.points[i].y + next.y) / 2 },
            type: "midpoint",
            segment: { a: e.points[i], b: next },
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

/**
 * Arista más cercana + proyección.
 * Incluye `segment` para resaltar la arista (estilo AutoCAD).
 */
export function findNearestEdgeSnap(
  entities: Entity[],
  point: Point,
  scale: number
): SnapCandidate | null {
  const tol = (SNAP_TOLERANCE_PX * 2) / scale
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
      const type: SnapCandidate["type"] =
        t < 0.02 ? "endpoint" : t > 0.98 ? "endpoint" : "nearest"
      best = {
        point: t < 0.02 ? a : t > 0.98 ? b : proj,
        type: type === "endpoint" && (t < 0.02 || t > 0.98) ? "endpoint" : t > 0.45 && t < 0.55 ? "midpoint" : "nearest",
        segment: { a, b },
      }
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
  scale: number
): SnapCandidate | null {
  const pt = findNearestSnap(entities, point, scale)
  if (pt) {
    // Aún así buscar arista cercana para highlight
    const edge = findNearestEdgeSnap(entities, point, scale)
    if (edge?.segment) return { ...pt, segment: edge.segment }
    return pt
  }
  return findNearestEdgeSnap(entities, point, scale)
}

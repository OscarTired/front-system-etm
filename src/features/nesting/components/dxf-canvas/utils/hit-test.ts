import type { Entity, Point } from "../types/types"
import { computeBounds, pointInPolygon } from "./geometry-utils"
import { HIT_TOLERANCE_PX } from "../types/types"

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function nearPolyline(p: Point, pts: Point[], tol: number, closed: boolean): boolean {
  if (pts.length < 2) return false
  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegment(p, pts[i], pts[i + 1]) <= tol) return true
  }
  if (closed && pts.length >= 3) {
    if (distToSegment(p, pts[pts.length - 1], pts[0]) <= tol) return true
  }
  return false
}

/**
 * Hit-test de pieza:
 * 1) polígono cerrado / PIP en polilíneas
 * 2) distancia a aristas (subOutlines abiertas)
 * 3) bbox de la pieza
 */
export function hitTestPieceAt(
  entities: Entity[],
  point: Point,
  scale: number
): number | null {
  const tol = HIT_TOLERANCE_PX / Math.max(scale, 1e-6)
  let hit: number | null = null

  const byPiece = new Map<number, Entity[]>()
  for (const e of entities) {
    if (e.pieceIndex === undefined) continue
    const list = byPiece.get(e.pieceIndex)
    if (list) list.push(e)
    else byPiece.set(e.pieceIndex, [e])
  }

  for (const [pieceIndex, ents] of byPiece) {
    let matched = false

    for (const e of ents) {
      if (e.kind === "polyline" && e.points.length >= 2) {
        if (e.points.length >= 3 && pointInPolygon(point, e.points)) {
          matched = true
          break
        }
        if (nearPolyline(point, e.points, tol, e.closed)) {
          matched = true
          break
        }
      } else if (e.kind === "circle") {
        const d = Math.hypot(point.x - e.center.x, point.y - e.center.y)
        if (d <= e.radius + tol) {
          matched = true
          break
        }
      } else if (e.kind === "line") {
        if (distToSegment(point, e.a, e.b) <= tol) {
          matched = true
          break
        }
      }
    }

    if (!matched) {
      const bounds = computeBounds(ents)
      if (
        bounds &&
        point.x >= bounds.minX &&
        point.x <= bounds.maxX &&
        point.y >= bounds.minY &&
        point.y <= bounds.maxY
      ) {
        matched = true
      }
    }

    if (matched) hit = pieceIndex
  }

  return hit
}


/** AABB por pieza a partir de entities (para box-select). */
export function pieceBoundsMap(
  entities: Entity[]
): Map<number, { minX: number; minY: number; maxX: number; maxY: number }> {
  const byPiece = new Map<number, Entity[]>()
  for (const e of entities) {
    if (e.pieceIndex === undefined) continue
    const list = byPiece.get(e.pieceIndex)
    if (list) list.push(e)
    else byPiece.set(e.pieceIndex, [e])
  }
  const out = new Map<number, { minX: number; minY: number; maxX: number; maxY: number }>()
  for (const [idx, ents] of byPiece) {
    const b = computeBounds(ents)
    if (b) out.set(idx, b)
  }
  return out
}

/** Piezas dentro / que intersectan un rectángulo en coords locales. */
export function piecesInBox(
  entities: Entity[],
  box: { minX: number; minY: number; maxX: number; maxY: number },
  mode: "contain" | "intersect"
): number[] {
  const bounds = pieceBoundsMap(entities)
  const hits: number[] = []
  for (const [idx, b] of bounds) {
    if (mode === "contain") {
      if (
        b.minX >= box.minX &&
        b.maxX <= box.maxX &&
        b.minY >= box.minY &&
        b.maxY <= box.maxY
      ) {
        hits.push(idx)
      }
    } else {
      if (
        !(b.maxX < box.minX || b.minX > box.maxX || b.maxY < box.minY || b.minY > box.maxY)
      ) {
        hits.push(idx)
      }
    }
  }
  return hits
}

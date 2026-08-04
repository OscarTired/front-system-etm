import type { Entity, Point } from "../types/types"

export function computeBounds(entities: Entity[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const expand = (p: Point) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  for (const e of entities) {
    if (e.kind === "line") {
      expand(e.a)
      expand(e.b)
    } else if (e.kind === "polyline") {
      e.points.forEach(expand)
    } else if (e.kind === "circle") {
      expand({ x: e.center.x - e.radius, y: e.center.y - e.radius })
      expand({ x: e.center.x + e.radius, y: e.center.y + e.radius })
    } else if (e.kind === "arc") {
      expand({ x: e.center.x - e.radius, y: e.center.y - e.radius })
      expand({ x: e.center.x + e.radius, y: e.center.y + e.radius })
    } else if (e.kind === "text") {
      expand(e.position)
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
  return { minX, minY, maxX, maxY }
}

/** Ray casting estándar para hit-test de selección de pieza. */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

/** Área por la fórmula del shoelace (valor absoluto). */
export function polygonArea(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    sum += p1.x * p2.y - p2.x * p1.y
  }
  return Math.abs(sum) / 2
}

export function polygonPerimeter(points: Point[]): number {
  let total = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    total += Math.hypot(p2.x - p1.x, p2.y - p1.y)
  }
  return total
}

export function angleOfVector(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

export function fmtMm(v: number): string {
  return `${v.toFixed(1)}mm`
}

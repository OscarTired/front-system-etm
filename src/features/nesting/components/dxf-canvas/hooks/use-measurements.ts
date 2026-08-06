"use client"

import { useCallback, useState } from "react"
import type { Entity, Measurement, MeasureTool, Point } from "../types/types"
import { pointInPolygon, polygonArea, polygonPerimeter } from "../utils/geometry-utils"

const HIT_TOLERANCE_PX = 8

function angleOfVector(origin: Point, p: Point) {
  return Math.atan2(p.y - origin.y, p.x - origin.x)
}

export type ToolClickOptions = {
  /** Shift = forzar cota horizontal o vertical (eje dominante). */
  shiftKey?: boolean
}

/**
 * Auto-cota del bounding box de una selección (ancho + alto).
 * `bounds` en coords mundo.
 */
export function measurementsFromBBox(
  bounds: { x: number; y: number; width: number; height: number },
  offsetMm = 12,
): Measurement[] {
  const { x, y, width, height } = bounds
  if (width < 1e-6 && height < 1e-6) return []
  const id = Date.now()
  const out: Measurement[] = []
  // Ancho (horizontal) arriba
  if (width > 1e-6) {
    out.push({
      id: `bbox-w-${id}`,
      kind: "distance",
      a: { x, y: y + height },
      b: { x: x + width, y: y + height },
      value: width,
      offset: offsetMm,
    })
  }
  // Alto (vertical) a la derecha
  if (height > 1e-6) {
    out.push({
      id: `bbox-h-${id}`,
      kind: "distance",
      a: { x: x + width, y },
      b: { x: x + width, y: y + height },
      value: height,
      offset: offsetMm,
    })
  }
  return out
}

export function useMeasurements() {
  const [activeTool, setActiveTool] = useState<MeasureTool>("none")
  const [pendingPoints, setPendingPoints] = useState<Point[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [hoverLocal, setHoverLocal] = useState<Point | null>(null)
  const [hoverScreen, setHoverScreen] = useState<Point | null>(null)

  const resetTool = useCallback(() => {
    setActiveTool("none")
    setPendingPoints([])
  }, [])

  const toggleTool = useCallback((tool: Exclude<MeasureTool, "none">) => {
    setActiveTool((prev) => {
      if (prev === tool) {
        setPendingPoints([])
        return "none"
      }
      setPendingPoints([])
      return tool
    })
  }, [])

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const clearMeasurements = useCallback(() => setMeasurements([]), [])

  const addMeasurements = useCallback((items: Measurement[]) => {
    if (items.length === 0) return
    setMeasurements((prev) => [...prev, ...items])
  }, [])

  const hitTestCircleOrArc = useCallback(
    (entities: Entity[], point: Point, scale: number): { center: Point; radius: number } | null => {
      const tol = HIT_TOLERANCE_PX / scale
      for (const e of entities) {
        if (e.kind !== "circle" && e.kind !== "arc") continue
        const dist = Math.hypot(point.x - e.center.x, point.y - e.center.y)
        if (Math.abs(dist - e.radius) <= tol) return { center: e.center, radius: e.radius }
      }
      return null
    },
    [],
  )

  const hitTestClosedContour = useCallback((entities: Entity[], point: Point): Point[] | null => {
    for (const e of entities) {
      if (e.kind !== "polyline" || !e.closed || e.points.length < 3) continue
      if (pointInPolygon(point, e.points)) return e.points
    }
    return null
  }, [])

  const handleToolClick = useCallback(
    (point: Point, entities: Entity[], scale: number, opts?: ToolClickOptions) => {
      if (activeTool === "distance") {
        if (pendingPoints.length < 2) {
          let p = point
          // Shift en el 2º clic: forzar H o V respecto al primero
          if (opts?.shiftKey && pendingPoints.length === 1) {
            const a = pendingPoints[0]
            const adx = Math.abs(point.x - a.x)
            const ady = Math.abs(point.y - a.y)
            p = adx >= ady ? { x: point.x, y: a.y } : { x: a.x, y: point.y }
          }
          setPendingPoints([...pendingPoints, p])
          return
        }
        const [a, b] = pendingPoints
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const offset = (point.x - mid.x) * nx + (point.y - mid.y) * ny
        setMeasurements((prev) => [
          ...prev,
          {
            id: `d-${Date.now()}`,
            kind: "distance",
            a,
            b,
            value: len,
            offset,
          },
        ])
        setPendingPoints([])
      } else if (activeTool === "radius") {
        const hit = hitTestCircleOrArc(entities, point, scale)
        if (!hit) return
        setMeasurements((prev) => [
          ...prev,
          {
            id: `r-${Date.now()}`,
            kind: "radius",
            center: hit.center,
            radius: hit.radius,
            anglePoint: point,
          },
        ])
      } else if (activeTool === "angle") {
        const next = [...pendingPoints, point]
        if (next.length < 3) {
          setPendingPoints(next)
          return
        }
        const [vertex, p1, p2] = next
        const a1 = angleOfVector(vertex, p1)
        const a2 = angleOfVector(vertex, p2)
        let degrees = Math.abs((a2 - a1) * (180 / Math.PI))
        if (degrees > 180) degrees = 360 - degrees
        setMeasurements((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, kind: "angle", vertex, p1, p2, degrees },
        ])
        setPendingPoints([])
      } else if (activeTool === "area") {
        const contour = hitTestClosedContour(entities, point)
        if (!contour) return
        const area = polygonArea(contour)
        const perimeter = polygonPerimeter(contour)
        const centroid = contour.reduce(
          (acc, p) => ({ x: acc.x + p.x / contour.length, y: acc.y + p.y / contour.length }),
          { x: 0, y: 0 },
        )
        setMeasurements((prev) => [
          ...prev,
          {
            id: `ar-${Date.now()}`,
            kind: "area",
            points: contour,
            area,
            perimeter,
            centroid,
          },
        ])
      }
    },
    [activeTool, pendingPoints, hitTestCircleOrArc, hitTestClosedContour],
  )

  return {
    activeTool,
    pendingPoints,
    measurements,
    hoverLocal,
    hoverScreen,
    setHoverLocal,
    setHoverScreen,
    resetTool,
    toggleTool,
    removeMeasurement,
    clearMeasurements,
    addMeasurements,
    handleToolClick,
  }
}

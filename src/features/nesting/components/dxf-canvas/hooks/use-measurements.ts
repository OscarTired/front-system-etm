import { useCallback, useState } from "react"
import { angleOfVector, pointInPolygon, polygonArea, polygonPerimeter } from "../utils/geometry-utils"
import type { Entity, Measurement, MeasureTool, Point } from "../types/types"
import { HIT_TOLERANCE_PX } from "../types/types"

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
    []
  )

  const hitTestClosedContour = useCallback((entities: Entity[], point: Point): Point[] | null => {
    for (const e of entities) {
      if (e.kind !== "polyline" || !e.closed || e.points.length < 3) continue
      if (pointInPolygon(point, e.points)) return e.points
    }
    return null
  }, [])

  const handleToolClick = useCallback(
    (point: Point, entities: Entity[], scale: number) => {
      if (activeTool === "distance") {
        // Clic 1 = A, clic 2 = B, clic 3 = posición de la cota (offset)
        if (pendingPoints.length < 2) {
          setPendingPoints([...pendingPoints, point])
          return
        }
        const [a, b] = pendingPoints
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        // Normal unitario perpendicular
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
          { x: 0, y: 0 }
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
    [activeTool, pendingPoints, hitTestCircleOrArc, hitTestClosedContour]
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
    handleToolClick,
  }
}

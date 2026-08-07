"use client"

import { useCallback, useState } from "react"
import type { Entity, Measurement, MeasureTool, Point } from "../types/types"
import { pointInPolygon, polygonArea, polygonPerimeter } from "../utils/geometry-utils"

const HIT_TOLERANCE_PX = 8

/** Tolerancia angular (rad) para sugerir/forzar cota ortogonal (H o V). ~8°. */
const ORTHO_ANGLE_TOL = (8 * Math.PI) / 180

function angleOfVector(origin: Point, p: Point) {
  return Math.atan2(p.y - origin.y, p.x - origin.x)
}

/**
 * Si el segundo punto está cerca de horizontal o vertical respecto al
 * primero, proyectarlo sobre ese eje (estilo FreeCAD / AutoCAD ortho).
 * Shift fuerza siempre el eje dominante.
 */
export function applyOrthoConstraint(
  a: Point,
  b: Point,
  opts?: { force?: boolean; angleTol?: number },
): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  if (adx < 1e-12 && ady < 1e-12) return b

  if (opts?.force) {
    return adx >= ady ? { x: b.x, y: a.y } : { x: a.x, y: b.y }
  }

  const ang = Math.atan2(ady, adx) // 0 = horizontal, π/2 = vertical
  const tol = opts?.angleTol ?? ORTHO_ANGLE_TOL
  if (ang < tol) return { x: b.x, y: a.y }
  if (ang > Math.PI / 2 - tol) return { x: a.x, y: b.y }
  return b
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
    // Al salir de la herramienta, limpiar todas las cotas visibles.
    setMeasurements([])
    setHoverLocal(null)
    setHoverScreen(null)
  }, [])

  /**
   * Igual que resetTool pero SIN desactivar la herramienta — para usar
   * al cambiar de plancha/pestaña. Las mediciones están en coordenadas
   * de mundo de una plancha específica; mostrarlas sobre otra plancha
   * distinta no tiene sentido geométrico ("se quedan pegadas"). Pero
   * el MODO de trabajo (que sigas en modo regla, por ejemplo) es una
   * preferencia del usuario, no un dato geométrico — no hay razón para
   * sacarlo de la herramienta solo por cambiar de pestaña.
   */
  const resetMeasurementsOnly = useCallback(() => {
    setPendingPoints([])
    setMeasurements([])
    setHoverLocal(null)
    setHoverScreen(null)
  }, [])

  const toggleTool = useCallback((tool: Exclude<MeasureTool, "none">) => {
    setActiveTool((prev) => {
      if (prev === tool) {
        // Desactivar: limpiar pendientes Y mediciones colocadas.
        setPendingPoints([])
        setMeasurements([])
        setHoverLocal(null)
        setHoverScreen(null)
        return "none"
      }
      // Cambiar de herramienta: limpiar pendientes y mediciones previas.
      setPendingPoints([])
      setMeasurements([])
      setHoverLocal(null)
      setHoverScreen(null)
      return tool
    })
  }, [])

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const clearMeasurements = useCallback(() => setMeasurements([]), [])

  /**
   * Reposiciona una cota de distancia YA colocada — esto es lo que
   * permite "jalar" la línea de cota después de puesta, como en un
   * plano real, en vez de que el offset quede fijo desde el momento
   * en que se hizo el 2º click.
   */
  const updateMeasurementOffset = useCallback((id: string, offset: number) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id && m.kind === "distance" ? { ...m, offset } : m)),
    )
  }, [])

  const addMeasurements = useCallback((items: Measurement[]) => {
    if (items.length === 0) return
    setMeasurements((prev) => [...prev, ...items])
  }, [])

  /**
   * Ningún lugar del pipeline (dxf-parser.ts → entities.ts) construye
   * jamás una entidad `kind: "circle"` o `"arc"` real — todo círculo u
   * agujero de un DXF llega como `kind: "polyline"` genérico (puntos
   * sampleados alrededor del círculo). Por eso la herramienta de radio/
   * diámetro nunca encontraba nada: buscaba un tipo de entidad que
   * jamás se construye. Esto detecta si una polyline cerrada es, en la
   * práctica, un círculo (todos sus puntos a ~la misma distancia del
   * centroide) y la trata como tal.
   */
  const detectCircleFromPolyline = useCallback(
    (points: Point[]): { center: Point; radius: number } | null => {
      if (points.length < 8) return null
      let pts = points
      const f = pts[0]
      const l = pts[pts.length - 1]
      if (Math.hypot(f.x - l.x, f.y - l.y) < 1e-4 && pts.length >= 9) pts = pts.slice(0, -1)
      if (pts.length < 8) return null

      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
      const dists = pts.map((p) => Math.hypot(p.x - cx, p.y - cy))
      const avgR = dists.reduce((s, d) => s + d, 0) / dists.length
      if (avgR < 1e-6) return null
      const maxDev = Math.max(...dists.map((d) => Math.abs(d - avgR)))
      // Tolerancia ~1.5% del radio: un círculo sampleado cae muy por
      // dentro de esto; un hexágono/octágono real se sale por mucho más
      // (>10%), así que no hay falsos positivos con polígonos reales.
      if (maxDev / avgR > 0.015) return null
      return { center: { x: cx, y: cy }, radius: avgR }
    },
    [],
  )

  const hitTestCircleOrArc = useCallback(
    (entities: Entity[], point: Point, scale: number): { center: Point; radius: number } | null => {
      const tol = HIT_TOLERANCE_PX / scale
      for (const e of entities) {
        if (e.kind === "circle" || e.kind === "arc") {
          const dist = Math.hypot(point.x - e.center.x, point.y - e.center.y)
          if (Math.abs(dist - e.radius) <= tol) return { center: e.center, radius: e.radius }
          continue
        }
        if (e.kind === "polyline") {
          const circle = detectCircleFromPolyline(e.points)
          if (!circle) continue
          const dist = Math.hypot(point.x - circle.center.x, point.y - circle.center.y)
          if (Math.abs(dist - circle.radius) <= tol) return circle
        }
      }
      return null
    },
    [detectCircleFromPolyline],
  )

  const hitTestClosedContour = useCallback((entities: Entity[], point: Point): Point[] | null => {
    // CAD subOutlines suelen venir closed:false aunque sean loops cerrados
    let best: Point[] | null = null
    let bestArea = Infinity
    for (const e of entities) {
      if (e.kind !== "polyline" || e.points.length < 3) continue
      let pts = e.points
      const f = pts[0]
      const l = pts[pts.length - 1]
      if (Math.hypot(f.x - l.x, f.y - l.y) < 1e-4 && pts.length >= 4) {
        pts = pts.slice(0, -1)
      }
      if (pts.length < 3) continue
      if (!pointInPolygon(point, pts)) continue
      // Preferir el contorno de menor área (calado interno)
      let area = 0
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i]
        const p2 = pts[(i + 1) % pts.length]
        area += p1.x * p2.y - p2.x * p1.y
      }
      area = Math.abs(area) / 2
      if (area < bestArea) {
        bestArea = area
        best = pts
      }
    }
    return best
  }, [])

  const handleToolClick = useCallback(
    (point: Point, entities: Entity[], scale: number, opts?: ToolClickOptions) => {
      if (activeTool === "distance") {
        // Regla real: punto A → punto B, siempre 2 clicks explícitos.
        // Tras el 1er clic, el 2º se puede ortogonalizar (auto cerca de H/V
        // o forzado con Shift), estilo FreeCAD.
        if (pendingPoints.length === 0) {
          setPendingPoints([point])
          return
        }
        if (pendingPoints.length === 1) {
          const a = pendingPoints[0]
          const constrained = applyOrthoConstraint(a, point, {
            force: Boolean(opts?.shiftKey),
          })
          setPendingPoints([a, constrained])
          return
        }
        // 3er clic: colocar offset de la línea de cota
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
    updateMeasurementOffset,
    addMeasurements,
    handleToolClick,
    hitTestClosedContour,
    resetMeasurementsOnly,
  }
}
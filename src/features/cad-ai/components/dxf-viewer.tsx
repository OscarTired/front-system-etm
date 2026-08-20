"use client"

import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import type { PlanGeometry, Entity, Tool } from "../types"
import { Toolbar } from "./toolbar"
import { PropertiesPanel } from "./properties-panel"
import {
  toScreen, fromScreen, getEntityBounds, getEntityCenter,
  moveEntity, rotateEntity, createEntity, updateEntitiesInGeometry,
  pointToEntityDistance, getEntityColor, drawGrid, drawEntity,
  entityArea,
  SELECTED_COLOR, AI_SELECT_COLOR,
  type ViewTransform,
} from "../lib/geometry"
import { findSnap, constrainTo45, constrainToAxis, drawSnapIndicator, drawAngleGuide, type SnapResult } from "../lib/snap"
import { distanceToMeasurement, drawMeasurement, drawMeasurementInfo, type Measurement } from "../lib/measurements"
import { RULER_SIZE, drawRulers, drawCursorCoords } from "../lib/rulers"

interface DxfViewerProps {
  geometry: PlanGeometry | null
  className?: string
  onGeometryChange?: (geometry: PlanGeometry) => void
  onSendToAI?: (entities: Entity[]) => void
}

const SNAP_PX = 10

function pointInsideEntity(e: Entity, x: number, y: number): boolean {
  switch (e.type) {
    case "rectangle":
      return x >= e.x && x <= e.x + e.width && y >= e.y && y <= e.y + e.height
    case "circle": {
      const dx = x - e.center[0]
      const dy = y - e.center[1]
      return dx * dx + dy * dy <= e.radius * e.radius
    }
    case "ellipse": {
      const dx = (x - e.center[0]) / e.radiusX
      const dy = (y - e.center[1]) / e.radiusY
      return dx * dx + dy * dy <= 1
    }
    case "polyline": {
      const pts = e.points
      if (pts.length < 3) return false
      const flagged = e.closed
      const [fx, fy] = pts[0]
      const [lx, ly] = pts[pts.length - 1]
      if (!flagged && Math.hypot(lx - fx, ly - fy) > 1e-9) return false
      let inside = false
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i]
        const [xj, yj] = pts[j]
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }
      return inside
    }
    default:
      return false
  }
}

export function DxfViewer({ geometry, className, onGeometryChange, onSendToAI }: DxfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const transformRef = useRef<ViewTransform>({ scale: 1, offsetX: 0, offsetY: 0 })
  const toolRef = useRef<Tool>("select")
  const activeViewRef = useRef(0)
  const selectedIdsRef = useRef<Set<number>>(new Set())
  const aiSelectIdsRef = useRef<Set<number>>(new Set())
  const hoveredIdRef = useRef<number | null>(null)
  const geometryRef = useRef<PlanGeometry | null>(geometry)
  const editingEntityRef = useRef<Entity | null>(null)
  const measureRef = useRef<{ points: [number, number][]; active: boolean }>({ points: [], active: false })
  const measurementsRef = useRef<Measurement[]>([])
  const nextMeasureIdRef = useRef(1)
  const selectedMeasurementRef = useRef<number | null>(null)
  const hoveredMeasurementRef = useRef<number | null>(null)
  const drawRef = useRef<{ active: boolean; start: [number, number] | null; guide: number | null }>({ active: false, start: null, guide: null })
  const previewEntityRef = useRef<Entity | null>(null)
  const snapEnabledRef = useRef(true)
  const snapRef = useRef<SnapResult | null>(null)
  const mouseRef = useRef<[number, number] | null>(null)
  const hasFitRef = useRef(false)

  const dragRef = useRef<{
    isDragging: boolean
    isPanning: boolean
    startSX: number; startSY: number
    startWX: number; startWY: number
    startOffsetX: number; startOffsetY: number
    didMove: boolean
    entities: Entity[] | null
  }>({ isDragging: false, isPanning: false, startSX: 0, startSY: 0, startWX: 0, startWY: 0, startOffsetX: 0, startOffsetY: 0, didMove: false, entities: null })

  const undoStackRef = useRef<PlanGeometry[]>([])
  const redoStackRef = useRef<PlanGeometry[]>([])

  const needsRedrawRef = useRef(true)
  const rafRef = useRef<number | null>(null)

  const [tool, setToolState] = useState<Tool>("select")
  const [activeView, setActiveViewState] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [aiSelectCount, setAiSelectCount] = useState(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  const [measureCount, setMeasureCount] = useState(0)
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<number | null>(null)
  const [snapEnabled, setSnapEnabled] = useState(true)

  useEffect(() => {
    geometryRef.current = geometry
    needsRedrawRef.current = true
  }, [geometry])

  const setTool = useCallback((t: Tool) => {
    const prevTool = toolRef.current
    toolRef.current = t
    setToolState(t)
    drawRef.current = { active: false, start: null, guide: null }
    previewEntityRef.current = null
    measureRef.current = { points: [], active: false }
    snapRef.current = null
    if (prevTool === "measure" && t !== "measure") {
      measurementsRef.current = []
      selectedMeasurementRef.current = null
      hoveredMeasurementRef.current = null
      setSelectedMeasurementId(null)
      setMeasureCount(0)
    }
    needsRedrawRef.current = true
  }, [])

  const toggleSnap = useCallback(() => {
    snapEnabledRef.current = !snapEnabledRef.current
    setSnapEnabled(snapEnabledRef.current)
    if (!snapEnabledRef.current) snapRef.current = null
    needsRedrawRef.current = true
  }, [])

  const getActiveEntities = useCallback((): Entity[] => {
    const geom = geometryRef.current
    if (!geom) return []
    if (geom.views && geom.views.length > 0 && activeViewRef.current < geom.views.length) {
      return geom.views[activeViewRef.current].entities
    }
    return geom.entities
  }, [])

  const computeBounds = useCallback((entities: Entity[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const e of entities) {
      for (const [x, y] of getEntityBounds(e)) {
        minX = Math.min(minX, x); minY = Math.min(minY, y)
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
      }
    }
    if (minX === Infinity) { return { minX: 0, minY: 0, maxX: 100, maxY: 100 } }
    return { minX, minY, maxX, maxY }
  }, [])

  const fitToView = useCallback(() => {
    const geom = geometryRef.current
    const container = containerRef.current
    if (!geom || !container) return
    const entities = getActiveEntities()
    const b = computeBounds(entities)
    const w = b.maxX - b.minX, h = b.maxY - b.minY
    const pad = 60
    const cw = container.clientWidth - pad * 2
    const ch = container.clientHeight - pad * 2
    if (w <= 0 || h <= 0) return
    const scale = Math.min(cw / w, ch / h)
    transformRef.current = {
      scale,
      offsetX: pad - b.minX * scale + (cw - w * scale) / 2,
      offsetY: pad + b.maxY * scale + (ch - h * scale) / 2,
    }
    needsRedrawRef.current = true
  }, [getActiveEntities, computeBounds])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    const t = transformRef.current
    const geom = geometryRef.current
    const entities = geom ? getActiveEntities() : []
    const selIds = selectedIdsRef.current
    const aiIds = aiSelectIdsRef.current
    const hovId = hoveredIdRef.current
    const tool = toolRef.current
    const measure = measureRef.current
    const measurements = measurementsRef.current

    ctx.fillStyle = "#fafafa"
    ctx.fillRect(0, 0, w, h)
    drawGrid(ctx, w, h, t)

    if (!geom) {
      ctx.fillStyle = "#999"
      ctx.font = "14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Sin geometría", w / 2, h / 2)
      return
    }

    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      if (e.type === "dimension" || e.layer === "DIM") {
        ctx.strokeStyle = getEntityColor(e)
        ctx.lineWidth = 0.8
        ctx.setLineDash([4, 2])
        drawEntity(ctx, e, t)
        ctx.setLineDash([])
      }
    }

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      if (e.type === "fold" || e.layer === "FOLD") {
        ctx.strokeStyle = getEntityColor(e)
        ctx.lineWidth = 1.2
        ctx.setLineDash([6, 4])
        drawEntity(ctx, e, t)
        ctx.setLineDash([])
      }
    }

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      if (e.type === "dimension" || e.type === "fold" || e.layer === "DIM" || e.layer === "FOLD") continue
      if (aiIds.has(i)) { ctx.strokeStyle = AI_SELECT_COLOR; ctx.lineWidth = 3 }
      else if (selIds.has(i)) { ctx.strokeStyle = SELECTED_COLOR; ctx.lineWidth = 2.5 }
      else if (hovId === i) { ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2 }
      else { ctx.strokeStyle = getEntityColor(e); ctx.lineWidth = 1.5 }
      ctx.fillStyle = ctx.strokeStyle
      drawEntity(ctx, e, t)
    }

    for (let i = 0; i < entities.length; i++) {
      if (entities[i].type === "text") drawEntity(ctx, entities[i], t)
    }

    for (const m of measurements) {
      drawMeasurement(ctx, m, t, {
        selected: m.id === selectedMeasurementRef.current,
        hovered: m.id === hoveredMeasurementRef.current,
      })
    }

    const draw = drawRef.current
    if (draw.active && draw.start && draw.guide !== null) {
      drawAngleGuide(ctx, draw.start, draw.guide, w, h, t)
    }

    if (measure.active && measure.points.length > 0) {
      const dist = measure.points.length === 2
        ? Math.hypot(measure.points[1][0] - measure.points[0][0], measure.points[1][1] - measure.points[0][1])
        : 0
      drawMeasurement(ctx, { id: -1, points: measure.points, distance: dist }, t, { dashed: true })
      if (measure.points.length === 2) {
        drawMeasurementInfo(ctx, measure.points[0], measure.points[1], t)
      }
    }

    const preview = previewEntityRef.current
    if (tool.startsWith("add-") && preview) {
      ctx.strokeStyle = SELECTED_COLOR
      ctx.fillStyle = SELECTED_COLOR
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 3])
      drawEntity(ctx, preview, t)
      ctx.setLineDash([])

      let label: string | null = null
      let labelWorld: [number, number] | null = null
      if (preview.type === "line" || preview.type === "fold") {
        const len = Math.hypot(preview.end[0] - preview.start[0], preview.end[1] - preview.start[1])
        const ang = (Math.atan2(preview.end[1] - preview.start[1], preview.end[0] - preview.start[0]) * 180) / Math.PI
        label = `${len.toFixed(1)} mm · ∠ ${ang.toFixed(1)}°`
        labelWorld = preview.end
      } else if (preview.type === "circle") {
        label = `⌀ ${(preview.radius * 2).toFixed(1)} mm`
        labelWorld = [preview.center[0] + preview.radius, preview.center[1]]
      } else if (preview.type === "rectangle") {
        label = `${preview.width.toFixed(1)} × ${preview.height.toFixed(1)} mm`
        labelWorld = [preview.x + preview.width, preview.y + preview.height]
      }

      if (label && labelWorld) {
        const [lx, ly] = toScreen(labelWorld[0], labelWorld[1], t)
        ctx.font = "11px sans-serif"
        const tw = ctx.measureText(label).width
        ctx.fillStyle = "white"
        ctx.fillRect(lx + 8, ly - 16, tw + 8, 16)
        ctx.fillStyle = SELECTED_COLOR
        ctx.textAlign = "left"
        ctx.fillText(label, lx + 12, ly - 4)
      }
    }

    if (snapRef.current) drawSnapIndicator(ctx, snapRef.current, t)

    drawRulers(ctx, w, h, t, mouseRef.current)
    if (mouseRef.current) {
      drawCursorCoords(ctx, mouseRef.current, t, geom.units || "mm", w, h)
    }
  }, [getActiveEntities])

  useEffect(() => {
    const loop = () => {
      if (needsRedrawRef.current) {
        needsRedrawRef.current = false
        render()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const cw = container.clientWidth
      const ch = container.clientHeight
      if (cw === 0 || ch === 0) return
      canvas.width = cw * dpr
      canvas.height = ch * dpr
      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      needsRedrawRef.current = true
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    window.addEventListener("resize", resize)
    return () => { ro.disconnect(); window.removeEventListener("resize", resize) }
  }, [])

  useEffect(() => {
    if (!geometry) {
      hasFitRef.current = false
      return
    }
    if (!hasFitRef.current) {
      hasFitRef.current = true
      activeViewRef.current = 0
      setActiveViewState(0)
      requestAnimationFrame(() => fitToView())
      return
    }
    requestAnimationFrame(() => {
      const container = containerRef.current
      if (!container) return
      const entities = getActiveEntities()
      const b = computeBounds(entities)
      const t = transformRef.current
      const [x1, y1] = toScreen(b.minX, b.minY, t)
      const [x2, y2] = toScreen(b.maxX, b.maxY, t)
      const left = Math.min(x1, x2), right = Math.max(x1, x2)
      const top = Math.min(y1, y2), bottom = Math.max(y1, y2)
      const visible = right > 0 && left < container.clientWidth && bottom > 0 && top < container.clientHeight
      if (!visible) fitToView()
    })
  }, [geometry, fitToView, getActiveEntities, computeBounds])

  const pushUndo = useCallback(() => {
    const geom = geometryRef.current
    if (!geom) return
    undoStackRef.current.push(JSON.parse(JSON.stringify(geom)))
    if (undoStackRef.current.length > 50) undoStackRef.current.shift()
    setCanUndo(true)
  }, [])

  const commitGeometry = useCallback((newGeom: PlanGeometry) => {
    pushUndo()
    redoStackRef.current = []
    setCanRedo(false)
    geometryRef.current = newGeom
    needsRedrawRef.current = true
    onGeometryChange?.(newGeom)
  }, [pushUndo, onGeometryChange])

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    const prev = undoStackRef.current.pop()!
    if (geometryRef.current) redoStackRef.current.push(JSON.parse(JSON.stringify(geometryRef.current)))
    geometryRef.current = prev
    setCanUndo(undoStackRef.current.length > 0)
    setCanRedo(true)
    needsRedrawRef.current = true
    onGeometryChange?.(prev)
  }, [onGeometryChange])

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    const next = redoStackRef.current.pop()!
    if (geometryRef.current) undoStackRef.current.push(JSON.parse(JSON.stringify(geometryRef.current)))
    geometryRef.current = next
    setCanRedo(redoStackRef.current.length > 0)
    setCanUndo(true)
    needsRedrawRef.current = true
    onGeometryChange?.(next)
  }, [onGeometryChange])

  const getEntityAt = useCallback((sx: number, sy: number): number | null => {
    const geom = geometryRef.current
    if (!geom) return null
    const t = transformRef.current
    const [wx, wy] = fromScreen(sx, sy, t)
    const entities = getActiveEntities()
    const threshold = 5 / t.scale

    let bestId = -1, bestDist = Infinity
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i]
      const dist = pointToEntityDistance(e, wx, wy)
      if (dist > threshold) continue
      if (dist <= 0.0001 && pointInsideEntity(e, wx, wy)) continue
      if (dist < bestDist) { bestDist = dist; bestId = i }
    }
    if (bestId >= 0) return bestId

    let bestArea = Infinity
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i]
      if (!pointInsideEntity(e, wx, wy)) continue
      const area = entityArea(e)
      if (area < bestArea) { bestArea = area; bestId = i }
    }
    return bestId >= 0 ? bestId : null
  }, [getActiveEntities])

  const getMeasurementAt = useCallback((sx: number, sy: number): number | null => {
    const t = transformRef.current
    const [wx, wy] = fromScreen(sx, sy, t)
    const threshold = 6 / t.scale
    const ms = measurementsRef.current
    for (let i = ms.length - 1; i >= 0; i--) {
      if (distanceToMeasurement(ms[i], wx, wy) <= threshold) return ms[i].id
    }
    return null
  }, [])

  const resolveSnap = useCallback((
    raw: [number, number],
    start: [number, number] | null,
    shiftKey: boolean,
  ): { point: [number, number]; snap: SnapResult | null; guide: number | null } => {
    const t = transformRef.current
    if (!snapEnabledRef.current) return { point: raw, snap: null, guide: null }
    const entities = getActiveEntities()
    const snap = findSnap(raw[0], raw[1], entities, SNAP_PX / t.scale)
    if (snap) return { point: snap.point, snap, guide: null }
    if (start) {
      if (shiftKey) {
        const c = constrainTo45(start, raw)
        return { point: c.point, snap: null, guide: c.angleDeg }
      }
      const ax = constrainToAxis(start, raw)
      if (ax) return { point: ax.point, snap: null, guide: ax.angleDeg }
    }
    return { point: raw, snap: null, guide: null }
  }, [getActiveEntities])

  const deleteMeasurement = useCallback((id: number) => {
    measurementsRef.current = measurementsRef.current.filter(m => m.id !== id)
    if (selectedMeasurementRef.current === id) {
      selectedMeasurementRef.current = null
      setSelectedMeasurementId(null)
    }
    if (hoveredMeasurementRef.current === id) hoveredMeasurementRef.current = null
    setMeasureCount(measurementsRef.current.length)
    needsRedrawRef.current = true
  }, [])

  const getMousePos = (e: React.MouseEvent): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return [0, 0]
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const [mx, my] = getMousePos(e)
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const prev = transformRef.current
    const newScale = Math.max(0.1, Math.min(50, prev.scale * delta))
    const ratio = newScale / prev.scale
    transformRef.current = {
      scale: newScale,
      offsetX: mx - (mx - prev.offsetX) * ratio,
      offsetY: my - (my - prev.offsetY) * ratio,
    }
    needsRedrawRef.current = true
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const [sx, sy] = getMousePos(e)
    const t = transformRef.current
    const [wx, wy] = fromScreen(sx, sy, t)
    const tool = toolRef.current

    if (tool === "pan" || e.button === 1 || (e.button === 0 && e.shiftKey && tool !== "measure" && !tool.startsWith("add-"))) {
      dragRef.current = { isDragging: false, isPanning: true, startSX: e.clientX, startSY: e.clientY, startWX: wx, startWY: wy, startOffsetX: t.offsetX, startOffsetY: t.offsetY, didMove: false, entities: null }
      return
    }

    if (tool === "measure") {
      const { point, snap } = resolveSnap([wx, wy], null, false)
      snapRef.current = snap
      drawRef.current = { active: true, start: point, guide: null }
      measureRef.current = { points: [point, point], active: true }
      needsRedrawRef.current = true
      return
    }

    if (tool.startsWith("add-")) {
      const { point, snap } = resolveSnap([wx, wy], null, false)
      snapRef.current = snap
      drawRef.current = { active: true, start: point, guide: null }
      previewEntityRef.current = createEntity(tool, point, point)
      needsRedrawRef.current = true
      return
    }

    if (tool === "ai-select") {
      const id = getEntityAt(sx, sy)
      if (id !== null) {
        const ids = aiSelectIdsRef.current
        if (ids.has(id)) ids.delete(id); else ids.add(id)
        setAiSelectCount(ids.size)
        needsRedrawRef.current = true
      }
      return
    }

    const mId = getMeasurementAt(sx, sy)
    if (mId !== null) {
      selectedMeasurementRef.current = mId
      setSelectedMeasurementId(mId)
      selectedIdsRef.current = new Set()
      setSelectedCount(0)
      needsRedrawRef.current = true
      return
    }
    if (selectedMeasurementRef.current !== null) {
      selectedMeasurementRef.current = null
      setSelectedMeasurementId(null)
    }

    const id = getEntityAt(sx, sy)
    if (id !== null) {
      if (e.shiftKey) {
        const ids = selectedIdsRef.current
        if (ids.has(id)) ids.delete(id); else ids.add(id)
        setSelectedCount(ids.size)
      } else {
        selectedIdsRef.current = new Set([id])
        setSelectedCount(1)
      }
      dragRef.current = { isDragging: true, isPanning: false, startSX: sx, startSY: sy, startWX: wx, startWY: wy, startOffsetX: 0, startOffsetY: 0, didMove: false, entities: getActiveEntities() }
    } else {
      selectedIdsRef.current = new Set()
      setSelectedCount(0)
      dragRef.current = { isDragging: false, isPanning: true, startSX: e.clientX, startSY: e.clientY, startWX: wx, startWY: wy, startOffsetX: t.offsetX, startOffsetY: t.offsetY, didMove: false, entities: null }
    }
    needsRedrawRef.current = true
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const [sx, sy] = getMousePos(e)
    mouseRef.current = [sx, sy]
    needsRedrawRef.current = true
    const dr = dragRef.current
    const t = transformRef.current

    if (dr.isPanning) {
      const dx = e.clientX - dr.startSX
      const dy = e.clientY - dr.startSY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dr.didMove = true
      transformRef.current = { ...t, offsetX: dr.startOffsetX + dx, offsetY: dr.startOffsetY + dy }
      needsRedrawRef.current = true
      return
    }

    if (dr.isDragging && dr.entities && selectedIdsRef.current.size > 0) {
      const [wx, wy] = fromScreen(sx, sy, t)
      const dx = wx - dr.startWX
      const dy = wy - dr.startWY
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        if (!dr.didMove) {
          pushUndo()
          dr.didMove = true
        }
      }
      const geom = geometryRef.current
      if (geom) {
        const newEntities = dr.entities.map((ent, i) =>
          selectedIdsRef.current.has(i) ? moveEntity(ent, dx, dy) : ent
        )
        geometryRef.current = updateEntitiesInGeometry(geom, activeViewRef.current, newEntities)
        needsRedrawRef.current = true
      }
      return
    }

    const draw = drawRef.current
    if (draw.active && draw.start) {
      const [wx, wy] = fromScreen(sx, sy, t)
      const tool = toolRef.current
      const { point, snap, guide } = resolveSnap([wx, wy], draw.start, e.shiftKey)
      snapRef.current = snap
      draw.guide = guide
      if (tool === "measure") {
        measureRef.current = { points: [draw.start, point], active: true }
      } else if (tool.startsWith("add-")) {
        previewEntityRef.current = createEntity(tool, draw.start, point)
      }
      needsRedrawRef.current = true
      return
    }

    const tool = toolRef.current

    if (tool === "measure" || tool.startsWith("add-")) {
      if (snapEnabledRef.current) {
        const [wx, wy] = fromScreen(sx, sy, t)
        const snap = findSnap(wx, wy, getActiveEntities(), SNAP_PX / t.scale)
        if (snap !== snapRef.current) {
          snapRef.current = snap
          needsRedrawRef.current = true
        }
      }
      return
    }

    if (tool === "select") {
      const mId = getMeasurementAt(sx, sy)
      if (mId !== hoveredMeasurementRef.current) {
        hoveredMeasurementRef.current = mId
        needsRedrawRef.current = true
      }
      if (mId === null) {
        const id = getEntityAt(sx, sy)
        if (id !== hoveredIdRef.current) {
          hoveredIdRef.current = id
          needsRedrawRef.current = true
        }
      } else if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null
        needsRedrawRef.current = true
      }
      return
    }

    if (tool === "ai-select") {
      const id = getEntityAt(sx, sy)
      if (id !== hoveredIdRef.current) {
        hoveredIdRef.current = id
        needsRedrawRef.current = true
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const dr = dragRef.current
    const draw = drawRef.current

    if (draw.active && draw.start) {
      const [sx, sy] = getMousePos(e)
      const t = transformRef.current
      const [wx, wy] = fromScreen(sx, sy, t)
      const tool = toolRef.current
      const { point } = resolveSnap([wx, wy], draw.start, e.shiftKey)
      snapRef.current = null
      draw.guide = null
      const distPx = Math.hypot((point[0] - draw.start[0]) * t.scale, (point[1] - draw.start[1]) * t.scale)
      const MIN_DRAG_PX = 4

      if (tool === "measure") {
        if (distPx > MIN_DRAG_PX) {
          const dist = Math.hypot(point[0] - draw.start[0], point[1] - draw.start[1])
          measurementsRef.current.push({ id: nextMeasureIdRef.current++, points: [draw.start, point], distance: dist })
          setMeasureCount(measurementsRef.current.length)
        }
        measureRef.current = { points: [], active: false }
      } else if (tool.startsWith("add-")) {
        if (distPx > MIN_DRAG_PX) {
          const newEntity = createEntity(tool, draw.start, point)
          if (newEntity) {
            const geom = geometryRef.current
            if (geom) {
              const entities = getActiveEntities()
              const newGeom = updateEntitiesInGeometry(geom, activeViewRef.current, [...entities, newEntity])
              commitGeometry(newGeom)
            }
          }
        }
        previewEntityRef.current = null
      }
      drawRef.current = { active: false, start: null, guide: null }
      needsRedrawRef.current = true
      return
    }

    if (dr.isDragging && dr.didMove) {
      onGeometryChange?.(geometryRef.current!)
    }
    dr.isDragging = false
    dr.isPanning = false
    dr.didMove = false
    dr.entities = null
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    mouseRef.current = null
    snapRef.current = null
    needsRedrawRef.current = true
    handleMouseUp(e)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (toolRef.current !== "select") return
    const [sx, sy] = getMousePos(e)
    const id = getEntityAt(sx, sy)
    if (id !== null) {
      const entities = getActiveEntities()
      const ent = entities[id]
      editingEntityRef.current = ent
      setEditingEntity(ent)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedMeasurementRef.current !== null) {
          deleteMeasurement(selectedMeasurementRef.current)
          return
        }
        if (selectedIdsRef.current.size > 0) {
          const geom = geometryRef.current
          if (geom) {
            const entities = getActiveEntities()
            const newEntities = entities.filter((_, i) => !selectedIdsRef.current.has(i))
            const newGeom = updateEntitiesInGeometry(geom, activeViewRef.current, newEntities)
            commitGeometry(newGeom)
            selectedIdsRef.current = new Set()
            setSelectedCount(0)
          }
        }
      } else if (e.key === "Escape") {
        selectedIdsRef.current = new Set()
        aiSelectIdsRef.current = new Set()
        selectedMeasurementRef.current = null
        setSelectedMeasurementId(null)
        measureRef.current = { points: [], active: false }
        drawRef.current = { active: false, start: null, guide: null }
        previewEntityRef.current = null
        snapRef.current = null
        setSelectedCount(0)
        setAiSelectCount(0)
        needsRedrawRef.current = true
      } else if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleSnap()
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault(); handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault(); handleRedo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIdsRef.current.size > 0) {
        const entities = getActiveEntities()
        ;(window as any).__dxfClipboard = Array.from(selectedIdsRef.current).map(i => entities[i])
      } else if ((e.ctrlKey || e.metaKey) && e.key === "v" && (window as any).__dxfClipboard) {
        const clipboard: Entity[] = (window as any).__dxfClipboard
        const geom = geometryRef.current
        if (geom) {
          const entities = getActiveEntities()
          const pasted = clipboard.map(ent => moveEntity(ent, 10, 10))
          const newGeom = updateEntitiesInGeometry(geom, activeViewRef.current, [...entities, ...pasted])
          commitGeometry(newGeom)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [getActiveEntities, commitGeometry, handleUndo, handleRedo, toggleSnap, deleteMeasurement])

  const handleDelete = useCallback(() => {
    if (selectedIdsRef.current.size > 0 && geometryRef.current) {
      const entities = getActiveEntities()
      const newEntities = entities.filter((_, i) => !selectedIdsRef.current.has(i))
      commitGeometry(updateEntitiesInGeometry(geometryRef.current, activeViewRef.current, newEntities))
      selectedIdsRef.current = new Set()
      setSelectedCount(0)
    }
  }, [getActiveEntities, commitGeometry])

  const handleCopy = useCallback(() => {
    if (selectedIdsRef.current.size > 0) {
      const entities = getActiveEntities()
      ;(window as any).__dxfClipboard = Array.from(selectedIdsRef.current).map(i => entities[i])
    }
  }, [getActiveEntities])

  const handleRotate = useCallback(() => {
    if (selectedIdsRef.current.size === 0 || !geometryRef.current) return
    const entities = getActiveEntities()
    const selEnts = Array.from(selectedIdsRef.current).map(i => entities[i])
    let cx = 0, cy = 0
    for (const e of selEnts) { const [x, y] = getEntityCenter(e); cx += x; cy += y }
    cx /= selEnts.length; cy /= selEnts.length
    const a = 90 * Math.PI / 180
    const newEntities = entities.map((e, i) => selectedIdsRef.current.has(i) ? rotateEntity(e, cx, cy, Math.cos(a), Math.sin(a)) : e)
    commitGeometry(updateEntitiesInGeometry(geometryRef.current, activeViewRef.current, newEntities))
  }, [getActiveEntities, commitGeometry])

  const handleSendToAI = useCallback(() => {
    if (aiSelectIdsRef.current.size > 0) {
      const entities = getActiveEntities()
      onSendToAI?.(Array.from(aiSelectIdsRef.current).map(i => entities[i]))
    }
  }, [getActiveEntities, onSendToAI])

  const handleEntityEdit = useCallback((newEntity: Entity) => {
    const geom = geometryRef.current
    const ent = editingEntityRef.current
    if (!geom || !ent) return
    const entities = getActiveEntities()
    const idx = entities.indexOf(ent)
    if (idx >= 0) {
      const newEntities = [...entities]
      newEntities[idx] = newEntity
      commitGeometry(updateEntitiesInGeometry(geom, activeViewRef.current, newEntities))
      editingEntityRef.current = newEntity
      setEditingEntity(newEntity)
    }
  }, [getActiveEntities, commitGeometry])

  const handleZoomIn = useCallback(() => {
    const prev = transformRef.current
    const container = containerRef.current
    const cx = (container?.clientWidth || 400) / 2
    const cy = (container?.clientHeight || 300) / 2
    const newScale = Math.min(50, prev.scale * 1.3)
    const ratio = newScale / prev.scale
    transformRef.current = { scale: newScale, offsetX: cx - (cx - prev.offsetX) * ratio, offsetY: cy - (cy - prev.offsetY) * ratio }
    needsRedrawRef.current = true
  }, [])

  const handleZoomOut = useCallback(() => {
    const prev = transformRef.current
    const container = containerRef.current
    const cx = (container?.clientWidth || 400) / 2
    const cy = (container?.clientHeight || 300) / 2
    const newScale = Math.max(0.1, prev.scale / 1.3)
    const ratio = newScale / prev.scale
    transformRef.current = { scale: newScale, offsetX: cx - (cx - prev.offsetX) * ratio, offsetY: cy - (cy - prev.offsetY) * ratio }
    needsRedrawRef.current = true
  }, [])

  const handleViewChange = useCallback((i: number) => {
    activeViewRef.current = i
    setActiveViewState(i)
    selectedIdsRef.current = new Set()
    aiSelectIdsRef.current = new Set()
    setSelectedCount(0)
    setAiSelectCount(0)
    requestAnimationFrame(() => fitToView())
  }, [fitToView])

  const handleUndoLastMeasurement = useCallback(() => {
    const ms = measurementsRef.current
    if (ms.length === 0) return
    const last = ms[ms.length - 1]
    deleteMeasurement(last.id)
  }, [deleteMeasurement])

  const handleClearMeasurements = useCallback(() => {
    measurementsRef.current = []
    selectedMeasurementRef.current = null
    hoveredMeasurementRef.current = null
    setSelectedMeasurementId(null)
    setMeasureCount(0)
    needsRedrawRef.current = true
  }, [])

  const views = geometry?.views || []
  const activeEntities = geometry ? getActiveEntities() : []
  const activeViewGeom = views.length > 0 ? views[activeView] : null

  const cursor = useMemo(() => {
    if (tool === "pan") return "cursor-grab active:cursor-grabbing"
    if (tool === "measure" || tool.startsWith("add-")) return "cursor-crosshair"
    if (tool === "ai-select") return "cursor-pointer"
    return "cursor-default"
  }, [tool])

  return (
    <div className={`relative overflow-hidden bg-[#fafafa] flex flex-col h-full min-h-0 ${className || ""}`}>
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={fitToView}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onRotate={handleRotate}
        onSendToAI={handleSendToAI}
        aiSelectCount={aiSelectCount}
        selectedCount={selectedCount}
        snapEnabled={snapEnabled}
        onToggleSnap={toggleSnap}
      />

      <div ref={containerRef} className="flex-1 min-h-0 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          className={cursor}
          style={{ display: "block", width: "100%", height: "100%" }}
        />

        {views.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 rounded-md border border-border shadow-sm p-1 z-10">
            {views.map((v, i) => (
              <button
                key={i}
                onClick={() => handleViewChange(i)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  i === activeView ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                }`}
              >
                {v.label || v.name}
              </button>
            ))}
          </div>
        )}

        {geometry && (
          <div
            className="absolute top-2 rounded-md bg-white/90 border border-border px-2.5 py-1 text-xs text-muted-foreground shadow-sm z-10"
            style={{ left: RULER_SIZE + 8 }}
          >
            {activeEntities.length} ent · {activeViewGeom ? `${activeViewGeom.dimensions.width}×${activeViewGeom.dimensions.height}` : `${geometry.dimensions.width}×${geometry.dimensions.height}`} {geometry.units}
            {selectedCount > 0 && <span className="text-primary font-medium ml-1">· {selectedCount} sel</span>}
            {measureCount > 0 && <span className="text-green-600 ml-1">· {measureCount} med</span>}
          </div>
        )}

        {geometry && activeEntities.some(e => e.layer && e.layer !== "0") && (
          <div
            className="absolute bottom-9 flex flex-col gap-0.5 bg-white/90 rounded-md border border-border px-2 py-1.5 text-[10px] shadow-sm z-10"
            style={{ left: RULER_SIZE + 8 }}
          >
            {activeEntities.some(e => e.layer === "CUT") && <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#dc2626]"></span> Corte</div>}
            {activeEntities.some(e => e.layer === "ETCH") && <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#2563eb]"></span> Grabado</div>}
            {activeEntities.some(e => e.layer === "FOLD" || e.type === "fold") && <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#7c3aed]"></span> Pliegue</div>}
          </div>
        )}

        {measureCount > 0 && (
          <div className="absolute bottom-2 right-2 flex gap-1 z-10">
            <button
              onClick={handleUndoLastMeasurement}
              className="rounded-md bg-white border border-border px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-secondary transition-colors"
              title="Eliminar la última medición"
            >
              Deshacer última
            </button>
            <button
              onClick={handleClearMeasurements}
              className="rounded-md bg-white border border-border px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-secondary transition-colors"
            >
              Borrar mediciones
            </button>
          </div>
        )}

        {selectedMeasurementId !== null && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-amber-50 border border-amber-300 px-3 py-1 text-xs text-amber-700 shadow-sm z-10">
            Medición seleccionada · <kbd className="font-semibold">Supr</kbd> para eliminarla · <kbd className="font-semibold">Esc</kbd> para anular
          </div>
        )}

        {aiSelectCount > 0 && (
          <button
            onClick={() => { aiSelectIdsRef.current = new Set(); setAiSelectCount(0); needsRedrawRef.current = true }}
            className="absolute rounded-md bg-white border border-border px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-secondary transition-colors z-10"
            style={{ bottom: measureCount > 0 ? 40 : 8, right: 8 }}
          >
            Limpiar IA
          </button>
        )}

        <PropertiesPanel
          entity={editingEntity}
          onChange={handleEntityEdit}
          onClose={() => { editingEntityRef.current = null; setEditingEntity(null) }}
        />
      </div>
    </div>
  )
}

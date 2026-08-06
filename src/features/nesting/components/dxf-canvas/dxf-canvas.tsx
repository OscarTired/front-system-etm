"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Trash2, X, MousePointer2, Hand, Maximize2, RotateCw, Focus, CircleSlash, HelpCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CanvasTool } from "./types/types"

import { CanvasToolbar } from "./components/canvas-toolbar"
import { drawScene } from "./utils/draw"
import { buildToolpath, computeLayerList, piecesToEntities } from "./utils/entities"
import { fmtMm } from "./utils/geometry-utils"
import { hitTestPieceAt, piecesInBox } from "./utils/hit-test"
import {
  buildCollisionIndex,
  resolveDragOffset,
  type CollisionIndex,
  type SnapGuide,
} from "./utils/collision"
import { findNearestSnap, findSmartSnap } from "./utils/snap"
import type { DxfCanvasProps, Entity, Point, SnapCandidate } from "./types/types"
import { constrainToMode } from "../../utils/transform-mode"
import { useCanvasView } from "./hooks/use-canvas-view"
import { useMeasurements, measurementsFromBBox } from "./hooks/use-measurements"
import { useSimulation } from "./hooks/use-simulation"

export type { NestingPieceInput, LayerInfo, DxfCanvasProps } from "./types/types"
export { computeLayerList } from "./utils/entities"

type PieceDragState = {
  pieceIndices: number[]
  startLocal: Point
  offset: Point
}

export function DxfCanvas({
  pieces,
  sheetSize,
  selectedPieceIndices = [],
  onSelectPiece,
  hiddenKeys,
  collidingPieceIndices = [],
  lockedPieceIndices = [],
  onMovePieces,
  onRotateSelected,
  onRotateAroundPivot,
  onDeleteSelected,
  onDeleteFromProject,
  transformMode = "free",
  rotationStep = 90,
}: DxfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const entitiesRef = useRef<Entity[]>([])
  const drawRafRef = useRef<number | null>(null)

  const draggingRef = useRef<{
    startX: number
    startY: number
    startOffsetX: number
    startOffsetY: number
    moved: boolean
  } | null>(null)

  const pieceDragRef = useRef<PieceDragState | null>(null)
  const lockedPieceIndicesRef = useRef<number[]>(lockedPieceIndices)
  lockedPieceIndicesRef.current = lockedPieceIndices
  const spaceHeldRef = useRef(false)
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select")
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; pieceIndex: number | null } | null>(null)
  const [showCanvasHelp, setShowCanvasHelp] = useState(false)

  // Efecto para ocultar la guía de ayuda automáticamente después de 9 segundos
  useEffect(() => {
    if (showCanvasHelp) {
      const timer = setTimeout(() => {
        setShowCanvasHelp(false)
      }, 9000)
      return () => clearTimeout(timer)
    }
  }, [showCanvasHelp])

  const boxSelectRef = useRef<{
    startScreen: { x: number; y: number }
    curScreen: { x: number; y: number }
    startLocal: { x: number; y: number }
    curLocal: { x: number; y: number }
  } | null>(null)
  const [boxSelectScreen, setBoxSelectScreen] = useState<{
    x0: number; y0: number; x1: number; y1: number
  } | null>(null)
  const zoomWindowRef = useRef<{
    startScreen: { x: number; y: number }
    curScreen: { x: number; y: number }
    startLocal: { x: number; y: number }
    curLocal: { x: number; y: number }
  } | null>(null)
  const rotateDragRef = useRef<{
    pivot: { x: number; y: number }
    startAngle: number
    currentDelta: number
    pieceIndices: number[]
  } | null>(null)
  const [rotatePivotScreen, setRotatePivotScreen] = useState<{ x: number; y: number } | null>(null)
  const [rotatePreviewDelta, setRotatePreviewDelta] = useState(0)
  const collisionIndexRef = useRef<CollisionIndex | null>(null)
  const snapGuidesRef = useRef<SnapGuide[]>([])

  const [showGrid, setShowGrid] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [gridStyle, setGridStyle] = useState<"dots" | "lines" | "cross" | "none">("dots")
  const [snapCandidate, setSnapCandidate] = useState<SnapCandidate | null>(null)

  const view = useCanvasView()
  const sim = useSimulation()
  const measure = useMeasurements()

  const scheduleDraw = useCallback(() => {
    if (drawRafRef.current !== null) return
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return

      const tw = Math.round(w * dpr)
      const th = Math.round(h * dpr)
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw
        canvas.height = th
      }

      const drag = pieceDragRef.current
      const dragPreview =
        drag && (Math.abs(drag.offset.x) > 1e-12 || Math.abs(drag.offset.y) > 1e-12)
          ? { indices: drag.pieceIndices, dx: drag.offset.x, dy: drag.offset.y }
          : null

      drawScene({
        ctx,
        view: view.viewRef.current,
        canvasWidth: w,
        canvasHeight: h,
        entities: entitiesRef.current,
        sheetSize,
        selectedPieceIndices,
        collidingPieceIndices,
        simProgress: sim.progressRef.current,
        toolpath: sim.segmentsRef.current,
        totalPathLength: sim.totalLengthRef.current,
        fullPath2D: sim.fullPath2DRef.current,
        measurements: measure.measurements,
        pendingPoints: measure.pendingPoints,
        hoverLocal: measure.hoverLocal,
        hoverScreen: measure.hoverScreen,
        snapCandidate,
        activeTool: measure.activeTool,
        localToScreen: (p) => view.localToScreen(canvas, p),
        dragPreview,
        snapGuides: snapGuidesRef.current,
        boxSelectScreen,
        showGrid,
        gridStyle,
      })
    })
  }, [
    view,
    sheetSize,
    selectedPieceIndices,
    collidingPieceIndices,
    sim,
    measure.measurements,
    measure.pendingPoints,
    measure.hoverLocal,
    measure.hoverScreen,
    measure.activeTool,
    snapCandidate,
    boxSelectScreen,
    showGrid,
    gridStyle,
  ])

  useEffect(() => {
    collisionIndexRef.current = buildCollisionIndex(pieces)
    const entities = piecesToEntities(pieces, hiddenKeys)
    entitiesRef.current = entities
    const { segments, totalLength, fullPath } = buildToolpath(entities)
    sim.setToolpath(segments, totalLength, fullPath)
    requestAnimationFrame(() => {
      view.fitToSheetOrEntities(canvasRef.current, entities, sheetSize)
      scheduleDraw()
    })
  }, [pieces, sheetSize?.width, sheetSize?.height, hiddenKeys])

  useEffect(() => {
    scheduleDraw()
  }, [scheduleDraw, sim.progress])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => scheduleDraw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [scheduleDraw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setCursor = (c: string) => {
      canvas.style.cursor = c
    }

    const canvasCssPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const sx = (canvas.clientWidth || rect.width) / (rect.width || 1)
      const sy = (canvas.clientHeight || rect.height) / (rect.height || 1)
      return {
        x: (clientX - rect.left) * sx,
        y: (clientY - rect.top) * sy,
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      setCtxMenu(null)
      if (e.button === 2) return
      const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
      if (!rawPoint) return

      const forcePan = spaceHeldRef.current || e.button === 1 || canvasTool === "pan"
      if (forcePan) {
        draggingRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: view.viewRef.current.offsetX,
          startOffsetY: view.viewRef.current.offsetY,
          moved: false,
        }
        canvas.setPointerCapture(e.pointerId)
        setCursor("grabbing")
        return
      }

      if (canvasTool === "zoomWindow" && measure.activeTool === "none") {
        const screenPt = canvasCssPoint(e.clientX, e.clientY)
        zoomWindowRef.current = {
          startScreen: screenPt,
          curScreen: screenPt,
          startLocal: rawPoint,
          curLocal: rawPoint,
        }
        setBoxSelectScreen({ x0: screenPt.x, y0: screenPt.y, x1: screenPt.x, y1: screenPt.y })
        canvas.setPointerCapture(e.pointerId)
        setCursor("crosshair")
        return
      }

      if (canvasTool === "rotate" && measure.activeTool === "none") {
        const locked = new Set(lockedPieceIndicesRef.current)
        const movable = selectedPieceIndices.filter((i) => !locked.has(i))
        if (movable.length === 0) return
        const pivot = { x: rawPoint.x, y: rawPoint.y }
        rotateDragRef.current = {
          pivot,
          startAngle: Number.NaN,
          currentDelta: 0,
          pieceIndices: movable,
        }
        const rect = canvas.getBoundingClientRect()
        setRotatePivotScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setRotatePreviewDelta(0)
        canvas.setPointerCapture(e.pointerId)
        setCursor("crosshair")
        return
      }

      if (measure.activeTool === "none") {
        const hit = hitTestPieceAt(entitiesRef.current, rawPoint, view.viewRef.current.scale)

        if (hit !== null && selectedPieceIndices.includes(hit)) {
          const locked = new Set(lockedPieceIndicesRef.current)
          const movable = selectedPieceIndices.filter((i) => !locked.has(i))
          if (movable.length === 0) return
          pieceDragRef.current = {
            pieceIndices: movable,
            startLocal: rawPoint,
            offset: { x: 0, y: 0 },
          }
          canvas.setPointerCapture(e.pointerId)
          setCursor("move")
          return
        }

        if (hit === null && canvasTool === "select") {
          const screenPt = canvasCssPoint(e.clientX, e.clientY)
          boxSelectRef.current = {
            startScreen: screenPt,
            curScreen: screenPt,
            startLocal: rawPoint,
            curLocal: rawPoint,
          }
          setBoxSelectScreen({ x0: screenPt.x, y0: screenPt.y, x1: screenPt.x, y1: screenPt.y })
          canvas.setPointerCapture(e.pointerId)
          setCursor("crosshair")
          return
        }

        draggingRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: view.viewRef.current.offsetX,
          startOffsetY: view.viewRef.current.offsetY,
          moved: false,
        }
        canvas.setPointerCapture(e.pointerId)
        return
      }

      draggingRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: view.viewRef.current.offsetX,
        startOffsetY: view.viewRef.current.offsetY,
        moved: false,
      }
      canvas.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (boxSelectRef.current || zoomWindowRef.current) {
        const screenPt = canvasCssPoint(e.clientX, e.clientY)
        const local = view.screenToLocal(canvas, e.clientX, e.clientY)
        const active = boxSelectRef.current ?? zoomWindowRef.current
        if (active) {
          active.curScreen = screenPt
          if (local) active.curLocal = local
          setBoxSelectScreen({
            x0: active.startScreen.x,
            y0: active.startScreen.y,
            x1: screenPt.x,
            y1: screenPt.y,
          })
        }
        scheduleDraw()
        return
      }

      if (rotateDragRef.current) {
        const local = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (local) {
          const rd = rotateDragRef.current
          const dx = local.x - rd.pivot.x
          const dy = local.y - rd.pivot.y
          if (Math.hypot(dx, dy) > 1e-3) {
            const ang = Math.atan2(dy, dx)
            if (Number.isNaN(rd.startAngle)) rd.startAngle = ang
            let delta = ((ang - rd.startAngle) * 180) / Math.PI
            if (e.shiftKey) delta = Math.round(delta / 15) * 15
            rd.currentDelta = delta
            setRotatePreviewDelta(delta)
          }
        }
        scheduleDraw()
        return
      }

      if (measure.activeTool !== "none") {
        setCursor("crosshair")
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        const rect = canvas.getBoundingClientRect()
        const usesPointSnap =
          measure.activeTool === "distance" ||
          measure.activeTool === "angle" ||
          measure.activeTool === "coords" ||
          measure.activeTool === "radius"
        const snap =
          snapEnabled && usesPointSnap && rawPoint
            ? findSmartSnap(entitiesRef.current, rawPoint, view.viewRef.current.scale)
            : null
        setSnapCandidate(snap)
        measure.setHoverLocal(snap ? snap.point : rawPoint)
        measure.setHoverScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        scheduleDraw()
      }

      const pieceDrag = pieceDragRef.current
      if (pieceDrag) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (rawPoint) {
          let wantDx = rawPoint.x - pieceDrag.startLocal.x
          let wantDy = rawPoint.y - pieceDrag.startLocal.y
          ;({ dx: wantDx, dy: wantDy } = constrainToMode(transformMode, wantDx, wantDy))
          const resolved = resolveDragOffset(
            pieces,
            pieceDrag.pieceIndices,
            wantDx,
            wantDy,
            view.viewRef.current.scale,
            sheetSize,
            {
              clearance: 0,
              snapPx: 10,
              snapEnabled: snapEnabled && transformMode === "free",
              index: collisionIndexRef.current ?? undefined,
            }
          )
          pieceDrag.offset.x = resolved.dx
          pieceDrag.offset.y = resolved.dy
          snapGuidesRef.current = resolved.guides
          const pushed =
            resolved.blocked &&
            (Math.abs(wantDx - resolved.dx) > 0.5 || Math.abs(wantDy - resolved.dy) > 0.5)
          setCursor(pushed ? "not-allowed" : "move")
          scheduleDraw()
        }
        return
      }

      if (measure.activeTool === "none" && !draggingRef.current) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (rawPoint) {
          const hit = hitTestPieceAt(entitiesRef.current, rawPoint, view.viewRef.current.scale)
          if (hit !== null && selectedPieceIndices.includes(hit)) setCursor("move")
          else if (hit !== null) setCursor("pointer")
          else setCursor("grab")
        }
      }

      const drag = draggingRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!drag.moved) {
          drag.moved = true
          sim.clearOverlayIfIdle()
          setCursor("grabbing")
        }
      }
      view.panBy(dx, dy, drag.startOffsetX, drag.startOffsetY)
      scheduleDraw()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (zoomWindowRef.current) {
        const box = zoomWindowRef.current
        zoomWindowRef.current = null
        setBoxSelectScreen(null)
        const minX = Math.min(box.startLocal.x, box.curLocal.x)
        const maxX = Math.max(box.startLocal.x, box.curLocal.x)
        const minY = Math.min(box.startLocal.y, box.curLocal.y)
        const maxY = Math.max(box.startLocal.y, box.curLocal.y)
        if (maxX - minX > 1e-2 && maxY - minY > 1e-2) {
          view.fitToBounds(canvas, { minX, minY, maxX, maxY }, 0.95)
        }
        setCursor("crosshair")
        scheduleDraw()
        return
      }

      if (rotateDragRef.current) {
        const rd = rotateDragRef.current
        rotateDragRef.current = null
        setRotatePivotScreen(null)
        const delta = rd.currentDelta
        setRotatePreviewDelta(0)
        if (Math.abs(delta) > 0.05) {
          onRotateAroundPivot?.(rd.pieceIndices, rd.pivot, delta)
        }
        setCursor("crosshair")
        scheduleDraw()
        return
      }

      if (boxSelectRef.current) {
        const box = boxSelectRef.current
        boxSelectRef.current = null
        setBoxSelectScreen(null)
        const minX = Math.min(box.startLocal.x, box.curLocal.x)
        const maxX = Math.max(box.startLocal.x, box.curLocal.x)
        const minY = Math.min(box.startLocal.y, box.curLocal.y)
        const maxY = Math.max(box.startLocal.y, box.curLocal.y)
        const w = maxX - minX
        const h = maxY - minY
        if (w < 1e-3 && h < 1e-3) {
          if (onSelectPiece && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            onSelectPiece(null, false)
          }
          setCursor("default")
          scheduleDraw()
          return
        }
        const mode = box.curScreen.x >= box.startScreen.x ? "contain" : "intersect"
        const hits = piecesInBox(entitiesRef.current, { minX, minY, maxX, maxY }, mode)
        if (onSelectPiece) {
          const additive = e.shiftKey || e.ctrlKey || e.metaKey
          if (!additive) onSelectPiece(null, false)
          for (const idx of hits) onSelectPiece(idx, true)
        }
        setCursor("default")
        scheduleDraw()
        return
      }

      const pieceDrag = pieceDragRef.current
      pieceDragRef.current = null
      if (pieceDrag) {
        const { offset, pieceIndices } = pieceDrag
        if (Math.abs(offset.x) > 0.01 || Math.abs(offset.y) > 0.01) {
          onMovePieces?.(pieceIndices, offset.x, offset.y)
        }
        snapGuidesRef.current = []
        setCursor("default")
        scheduleDraw()
        return
      }

      const drag = draggingRef.current
      draggingRef.current = null
      if (!drag) return

      if (!drag.moved) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (!rawPoint) return

        if (measure.activeTool !== "none" && measure.activeTool !== "coords") {
          const usesPointSnap =
            measure.activeTool === "distance" ||
            measure.activeTool === "angle" ||
            measure.activeTool === "radius"
          const snap =
            snapEnabled && usesPointSnap
              ? findSmartSnap(entitiesRef.current, rawPoint!, view.viewRef.current.scale)
              : null
          measure.handleToolClick(
            snap ? snap.point : rawPoint,
            entitiesRef.current,
            view.viewRef.current.scale,
            { shiftKey: e.shiftKey },
          )
          return
        }

        if (measure.activeTool === "none" && onSelectPiece) {
          const hit = hitTestPieceAt(entitiesRef.current, rawPoint, view.viewRef.current.scale)
          onSelectPiece(hit, e.shiftKey || e.ctrlKey || e.metaKey)
        }
      }
      setCursor("default")
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      sim.clearOverlayIfIdle()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      view.zoomAt(canvas, e.clientX, e.clientY, factor)
      scheduleDraw()
    }

    // Clic derecho (anticlick) para salir/cancelar herramientas o ediciones activas
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()

      if (measure.activeTool !== "none") {
        measure.resetTool()
        setSnapCandidate(null)
        setCursor("default")
        scheduleDraw()
        return
      }

      if (canvasTool === "zoomWindow" || canvasTool === "rotate") {
        setCanvasTool("select")
        zoomWindowRef.current = null
        rotateDragRef.current = null
        setBoxSelectScreen(null)
        setRotatePivotScreen(null)
        setCursor("default")
        scheduleDraw()
        return
      }

      const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
      if (!rawPoint) return
      const hit =
        measure.activeTool === "none"
          ? hitTestPieceAt(entitiesRef.current, rawPoint, view.viewRef.current.scale)
          : null
      if (hit !== null && onSelectPiece && !selectedPieceIndices.includes(hit)) {
        onSelectPiece(hit, false)
      }
      setCtxMenu({ x: e.clientX, y: e.clientY, pieceIndex: hit })
    }

    canvas.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    canvas.addEventListener("contextmenu", onContextMenu)

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("contextmenu", onContextMenu)
    }
  }, [
    view,
    measure,
    sim,
    snapEnabled,
    selectedPieceIndices,
    onSelectPiece,
    onMovePieces,
    onRotateAroundPivot,
    transformMode,
    scheduleDraw,
    pieces,
    sheetSize,
    canvasTool,
  ])

  const handleZoom = useCallback(
    (direction: "in" | "out") => {
      sim.clearOverlayIfIdle()
      view.zoomBy(direction === "in" ? 1.25 : 0.8)
      scheduleDraw()
    },
    [view, sim, scheduleDraw]
  )

  const handleFit = useCallback(() => {
    view.fitToSheetOrEntities(canvasRef.current, entitiesRef.current, sheetSize)
    scheduleDraw()
  }, [view, sheetSize, scheduleDraw])

  const handleFocus = useCallback(() => {
    if (selectedPieceIndices.length === 0) return
    const selectedSet = new Set(selectedPieceIndices)
    const selected = entitiesRef.current.filter(
      (e) => e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex)
    )
    view.focusEntities(canvasRef.current, selected)
    scheduleDraw()
  }, [view, selectedPieceIndices, scheduleDraw])


  const handleAutoBboxDim = useCallback(() => {
    if (selectedPieceIndices.length === 0) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const i of selectedPieceIndices) {
      const piece = pieces[i]
      if (!piece?.outline?.length) continue
      for (const pt of piece.outline) {
        minX = Math.min(minX, pt.x)
        minY = Math.min(minY, pt.y)
        maxX = Math.max(maxX, pt.x)
        maxY = Math.max(maxY, pt.y)
      }
    }
    if (!Number.isFinite(minX)) return
    measure.addMeasurements(
      measurementsFromBBox({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }),
    )
    scheduleDraw()
  }, [selectedPieceIndices, pieces, measure, scheduleDraw])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === "Space") {
        e.preventDefault()
        spaceHeldRef.current = true
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedPieceIndices.length > 0 && onDeleteSelected) {
          e.preventDefault()
          onDeleteSelected(selectedPieceIndices)
        }
        return
      }
      if (e.key === "v" || e.key === "V") {
        setCanvasTool("select")
        return
      }
      if (e.key === "h" || e.key === "H") {
        setCanvasTool("pan")
        return
      }
      if (e.key === "Escape") {
        onSelectPiece?.(null, false)
        measure.resetTool()
        setCanvasTool("select")
        return
      }
      if (e.key !== "r" && e.key !== "R") return
      if (selectedPieceIndices.length === 0 || !onRotateSelected) return
      e.preventDefault()
      const deg = e.shiftKey ? -rotationStep : rotationStep
      onRotateSelected(selectedPieceIndices, deg)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = false
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [selectedPieceIndices, onRotateSelected, rotationStep, onSelectPiece, measure])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: "#0a0a0c" }}
    >
      <canvas ref={canvasRef} className="h-full w-full touch-none select-none" style={{ cursor: "default" }} />

      {/* Barra de estado inferior minimalista y limpia */}
      <div
        data-slot="canvas-status-bar"
        className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-[#101012]/95 px-3 py-1.5 text-xs text-neutral-400 shadow-lg backdrop-blur-sm"
      >
        <span className="font-semibold text-neutral-200">
          {canvasTool === "select" ? "V · Seleccionar" : "H · Pan"}
        </span>
        <span className="text-white/15">|</span>
        <span>
          {selectedPieceIndices.length === 0
            ? "Sin selección"
            : selectedPieceIndices.length === 1
              ? "1 pieza"
              : `${selectedPieceIndices.length} piezas`}
        </span>
        {collidingPieceIndices.length > 0 && (
          <>
            <span className="text-white/15">|</span>
            <span className="text-red-400 font-medium">
              {collidingPieceIndices.length} colisión{collidingPieceIndices.length === 1 ? "" : "es"}
            </span>
          </>
        )}
        
        {/* Botón de ayuda desplegable */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowCanvasHelp((prev) => !prev)}
            className="ml-1 rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Ayuda de atajos"
          >
            <HelpCircle size={13} />
          </button>

          {showCanvasHelp && (
            <div className="absolute bottom-8 left-0 z-40 w-60 rounded-xl bg-[#141416]/95 p-3 text-[11px] text-neutral-300 shadow-2xl backdrop-blur-md">
              <div className="z-90 font-semibold text-white mb-1">Guía rápida de interacción:</div>
              <ul className="space-y-1 text-neutral-400">
                <li>• <strong className="text-neutral-200">V</strong>: Modo Selección</li>
                <li>• <strong className="text-neutral-200">H o Espacio+Arrastrar</strong>: Panorámica</li>
                <li>• <strong className="text-neutral-200">Arrastrar fondo</strong>: Selección por caja</li>
                <li>• <strong className="text-neutral-200">Anticlick</strong>: Salir de herramienta actual</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Indicador modo interacción V/H superior */}
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-[#101012]/90 p-1 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            title="Seleccionar (V)"
            onClick={() => setCanvasTool("select")}
            className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
              canvasTool === "select"
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            V
          </button>
          <button
            type="button"
            title="Pan (H)"
            onClick={() => setCanvasTool("pan")}
            className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
              canvasTool === "pan"
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
            H
          </button>
        </div>
      </div>

      {ctxMenu && (
        <DropdownMenu open onOpenChange={(o) => { if (!o) setCtxMenu(null) }}>
          <DropdownMenuTrigger asChild>
            <span
              className="fixed h-0 w-0"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-48 border-white/10 bg-[#141416] text-neutral-100">
            {ctxMenu.pieceIndex !== null || selectedPieceIndices.length > 0 ? (
              <>
                <DropdownMenuItem
                  disabled={!onRotateSelected || selectedPieceIndices.length === 0}
                  onClick={() => onRotateSelected?.(selectedPieceIndices, rotationStep)}
                >
                  <RotateCw className="mr-2 h-4 w-4 opacity-70" />
                  Rotar +{rotationStep}°
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!onRotateSelected || selectedPieceIndices.length === 0}
                  onClick={() => onRotateSelected?.(selectedPieceIndices, -rotationStep)}
                >
                  <RotateCw className="mr-2 h-4 w-4 opacity-70 -scale-x-100" />
                  Rotar -{rotationStep}°
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedPieceIndices.length === 0}
                  onClick={() => handleFocus()}
                >
                  <Focus className="mr-2 h-4 w-4 opacity-70" />
                  Enfocar selección
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => onSelectPiece?.(null, false)}>
                  <CircleSlash className="mr-2 h-4 w-4 opacity-70" />
                  Quitar selección
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!onDeleteSelected || selectedPieceIndices.length === 0}
                  onClick={() => onDeleteSelected?.(selectedPieceIndices)}
                >
                  <Trash2 className="mr-2 h-4 w-4 opacity-70" />
                  Eliminar…
                  <span className="ml-auto text-[10px] text-neutral-500">Supr</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => setCanvasTool("select")}>
                  <MousePointer2 className="mr-2 h-4 w-4 opacity-70" />
                  Seleccionar
                  <span className="ml-auto text-[10px] text-neutral-500">V</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCanvasTool("pan")}>
                  <Hand className="mr-2 h-4 w-4 opacity-70" />
                  Pan
                  <span className="ml-auto text-[10px] text-neutral-500">H</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => handleFit()}>
                  <Maximize2 className="mr-2 h-4 w-4 opacity-70" />
                  Ajustar a plancha
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <CanvasToolbar
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onZoomIn={() => handleZoom("in")}
        onZoomOut={() => handleZoom("out")}
        onFit={handleFit}
        onFocusSelected={handleFocus}
        canFocusSelected={selectedPieceIndices.length > 0}
        onAutoBboxDim={handleAutoBboxDim}
        canAutoBboxDim={selectedPieceIndices.length > 0}
        activeTool={measure.activeTool}
        onToggleTool={measure.toggleTool}
        onResetTool={measure.resetTool}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled((v) => !v)}
        gridStyle={gridStyle}
        onGridStyleChange={setGridStyle}
        hasToolpath={sim.hasToolpath}
        simPanelOpen={sim.panelOpen}
        simRunning={sim.running}
        simProgress={sim.progress}
        simSpeed={sim.speed}
        onOpenSim={sim.openPanel}
        onCloseSim={sim.closePanel}
        onTogglePlay={sim.togglePlay}
        onResetSim={sim.reset}
        onSeek={sim.seek}
        onSpeedChange={sim.setSpeed}
      />

      {rotatePivotScreen && (
        <div
          className="pointer-events-none absolute z-20"
          style={{ left: rotatePivotScreen.x, top: rotatePivotScreen.y, transform: "translate(-50%, -50%)" }}
        >
          <div className="relative flex h-6 w-6 items-center justify-center">
            <div className="absolute h-px w-6 bg-cyan-400" />
            <div className="absolute h-6 w-px bg-cyan-400" />
            <div className="absolute h-2 w-2 rounded-full border border-cyan-300 bg-cyan-400/30" />
          </div>
          {Math.abs(rotatePreviewDelta) > 0.05 && (
            <div className="absolute left-4 top-4 whitespace-nowrap rounded bg-[#101012]/90 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
              {rotatePreviewDelta > 0 ? "+" : ""}
              {rotatePreviewDelta.toFixed(1)}°
            </div>
          )}
        </div>
      )}

      {canvasTool === "zoomWindow" && !boxSelectScreen && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-[#1c1c1e]/90 px-3 py-1.5 text-[11px] text-neutral-400 shadow-md">
          Arrastra un rectángulo para hacer zoom (Anticlick para salir)
        </div>
      )}
      {canvasTool === "rotate" && !rotatePivotScreen && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-[#1c1c1e]/90 px-3 py-1.5 text-[11px] text-neutral-400 shadow-md">
          Clic = pivot · arrastrar = ángulo (Shift = 15°) (Anticlick para salir)
        </div>
      )}

      {measure.activeTool !== "none" && (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-[#1c1c1e]/90 px-3 py-1.5 text-[11px] text-neutral-400 shadow-md backdrop-blur-md transition-opacity duration-200">
          {measure.activeTool === "distance" &&
            (measure.pendingPoints.length === 0
              ? "Cota: clic en el primer punto (snap a arista/extremo)"
              : measure.pendingPoints.length === 1
                ? "Cota: clic en el segundo punto"
                : "Cota: clic para colocar la línea de cota")}
          {measure.activeTool === "radius" && "Clic sobre un círculo o arco"}
          {measure.activeTool === "angle" &&
            (measure.pendingPoints.length === 0
              ? "Clic en el vértice"
              : measure.pendingPoints.length === 1
                ? "Clic en el primer punto"
                : "Clic en el segundo punto")}
          {measure.activeTool === "area" && "Clic dentro de un contorno cerrado"}
          {measure.activeTool === "coords" && "Mueve el mouse para ver X / Y"}
          {" (Anticlick para salir)"}
        </div>
      )}

      {collidingPieceIndices.length > 0 && (
        <div className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 shadow-md backdrop-blur-md">
          <AlertTriangle className="h-3.5 w-3.5" />
          {collidingPieceIndices.length === 1
            ? "1 pieza se solapa con otra"
            : `${collidingPieceIndices.length} piezas se solapan`}
        </div>
      )}

      {/* Panel de mediciones con altura segura sobre la barra inferior */}
      {measure.measurements.length > 0 && (
        <div className="absolute bottom-14 left-3 z-30 flex max-h-[45%] w-72 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-[#141416]/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Mediciones Activas
            </span>
            <button
              type="button"
              onClick={measure.clearMeasurements}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Borrar todas"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            {measure.measurements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 transition-colors"
              >
                <span className="font-medium truncate">
                  {m.kind === "distance" && fmtMm(m.value)}
                  {m.kind === "radius" && `R${m.radius.toFixed(1)} · ⌀${(m.radius * 2).toFixed(1)}`}
                  {m.kind === "angle" && `${m.degrees.toFixed(1)}°`}
                  {m.kind === "area" && `${(m.area / 1_000_000).toFixed(4)}m²`}
                </span>
                <button
                  type="button"
                  onClick={() => measure.removeMeasurement(m.id)}
                  className="shrink-0 rounded-lg p-1 text-neutral-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
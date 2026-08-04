"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"

import { CanvasToolbar } from "./components/canvas-toolbar"
import { drawScene } from "./utils/draw"
import { buildToolpath, computeLayerList, piecesToEntities } from "./utils/entities"
import { fmtMm, pointInPolygon } from "./utils/geometry-utils"
import { findNearestSnap } from "./utils/snap"
import type { DxfCanvasProps, Entity, Point, SnapCandidate } from "./types/types"
import { useCanvasView } from "./hooks/use-canvas-view"
import { useMeasurements } from "./hooks/use-measurements"
import { useSimulation } from "./hooks/use-simulation"

export type { NestingPieceInput, LayerInfo, DxfCanvasProps } from "./types/types"
export { computeLayerList } from "./utils/entities"

export function DxfCanvas({
  pieces,
  sheetSize,
  selectedPieceIndices = [],
  onSelectPiece,
  hiddenKeys,
  collidingPieceIndices = [],
  onMovePieces,
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
  const pieceDragRef = useRef<{ pieceIndices: number[]; startLocal: Point; offset: Point } | null>(
    null
  )

  const [showGrid, setShowGrid] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
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
  ])

  // Rebuild entities + toolpath when pieces / layers change
  useEffect(() => {
    const entities = piecesToEntities(pieces, hiddenKeys)
    entitiesRef.current = entities
    const { segments, totalLength, fullPath } = buildToolpath(entities)
    sim.setToolpath(segments, totalLength, fullPath)
    requestAnimationFrame(() => {
      view.fitToSheetOrEntities(canvasRef.current, entities, sheetSize)
      scheduleDraw()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Pointer / wheel interaction
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onPointerDown = (e: PointerEvent) => {
      const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)

      if (measure.activeTool === "none" && rawPoint && selectedPieceIndices.length > 0) {
        const selectedSet = new Set(selectedPieceIndices)
        let hitSelected = false
        for (const ent of entitiesRef.current) {
          if (
            ent.kind === "polyline" &&
            ent.pieceIndex !== undefined &&
            selectedSet.has(ent.pieceIndex) &&
            ent.points.length >= 3
          ) {
            if (pointInPolygon(rawPoint, ent.points)) hitSelected = true
          }
        }
        if (hitSelected) {
          pieceDragRef.current = {
            pieceIndices: [...selectedPieceIndices],
            startLocal: rawPoint,
            offset: { x: 0, y: 0 },
          }
          canvas.setPointerCapture(e.pointerId)
          canvas.style.cursor = "grabbing"
          return
        }
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
      if (measure.activeTool !== "none") {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        const rect = canvas.getBoundingClientRect()
        const usesPointSnap =
          measure.activeTool === "distance" ||
          measure.activeTool === "angle" ||
          measure.activeTool === "coords"
        const snap =
          snapEnabled && usesPointSnap && rawPoint
            ? findNearestSnap(entitiesRef.current, rawPoint, view.viewRef.current.scale)
            : null
        setSnapCandidate(snap)
        measure.setHoverLocal(snap ? snap.point : rawPoint)
        measure.setHoverScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }

      const pieceDrag = pieceDragRef.current
      if (pieceDrag) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (rawPoint) {
          pieceDrag.offset = {
            x: rawPoint.x - pieceDrag.startLocal.x,
            y: rawPoint.y - pieceDrag.startLocal.y,
          }
          scheduleDraw()
        }
        return
      }

      if (measure.activeTool === "none" && !draggingRef.current) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        let overSelected = false
        if (rawPoint && selectedPieceIndices.length > 0) {
          const selectedSet = new Set(selectedPieceIndices)
          for (const ent of entitiesRef.current) {
            if (
              ent.kind === "polyline" &&
              ent.pieceIndex !== undefined &&
              selectedSet.has(ent.pieceIndex) &&
              ent.points.length >= 3
            ) {
              if (pointInPolygon(rawPoint, ent.points)) overSelected = true
            }
          }
        }
        canvas.style.cursor = overSelected ? "move" : "grab"
      }

      const drag = draggingRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!drag.moved) {
          drag.moved = true
          sim.clearOverlayIfIdle()
        }
      }
      view.panBy(dx, dy, drag.startOffsetX, drag.startOffsetY)
      scheduleDraw()
    }

    const onPointerUp = (e: PointerEvent) => {
      const pieceDrag = pieceDragRef.current
      pieceDragRef.current = null
      if (pieceDrag) {
        canvas.style.cursor = "move"
        if (Math.abs(pieceDrag.offset.x) > 0.01 || Math.abs(pieceDrag.offset.y) > 0.01) {
          onMovePieces?.(pieceDrag.pieceIndices, pieceDrag.offset.x, pieceDrag.offset.y)
        }
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
            measure.activeTool === "distance" || measure.activeTool === "angle"
          const snap =
            snapEnabled && usesPointSnap
              ? findNearestSnap(entitiesRef.current, rawPoint, view.viewRef.current.scale)
              : null
          measure.handleToolClick(
            snap ? snap.point : rawPoint,
            entitiesRef.current,
            view.viewRef.current.scale
          )
          return
        }

        if (measure.activeTool === "none" && onSelectPiece) {
          let hit: number | null = null
          for (const ent of entitiesRef.current) {
            if (ent.kind === "polyline" && ent.pieceIndex !== undefined && ent.points.length >= 3) {
              if (pointInPolygon(rawPoint, ent.points)) hit = ent.pieceIndex
            }
          }
          onSelectPiece(hit, e.shiftKey || e.ctrlKey || e.metaKey)
        }
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      sim.clearOverlayIfIdle()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      view.zoomAt(canvas, e.clientX, e.clientY, factor)
      scheduleDraw()
    }

    canvas.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [
    view,
    measure,
    sim,
    snapEnabled,
    selectedPieceIndices,
    onSelectPiece,
    onMovePieces,
    scheduleDraw,
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

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: "#0a0a0c",
        backgroundImage: showGrid
          ? "radial-gradient(circle, #3a3a3f 1.5px, transparent 1.5px)"
          : "none",
        backgroundSize: "24px 24px",
      }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
      />

      <CanvasToolbar
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onZoomIn={() => handleZoom("in")}
        onZoomOut={() => handleZoom("out")}
        onFit={handleFit}
        onFocusSelected={handleFocus}
        canFocusSelected={selectedPieceIndices.length > 0}
        activeTool={measure.activeTool}
        onToggleTool={measure.toggleTool}
        onResetTool={measure.resetTool}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled((v) => !v)}
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

      {measure.activeTool !== "none" && (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-[#1c1c1e]/90 px-3 py-1.5 text-[11px] text-neutral-400 shadow-md backdrop-blur-md transition-opacity duration-200">
          {measure.activeTool === "distance" &&
            (measure.pendingPoints.length === 0
              ? "Clic en el primer punto"
              : "Clic en el segundo punto")}
          {measure.activeTool === "radius" && "Clic sobre un círculo o arco"}
          {measure.activeTool === "angle" &&
            (measure.pendingPoints.length === 0
              ? "Clic en el vértice"
              : measure.pendingPoints.length === 1
                ? "Clic en el primer punto"
                : "Clic en el segundo punto")}
          {measure.activeTool === "area" && "Clic dentro de un contorno cerrado"}
          {measure.activeTool === "coords" && "Mueve el mouse para ver X / Y"}
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

      {measure.measurements.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 flex max-h-[40%] max-w-55 flex-col gap-1 overflow-y-auto rounded-2xl bg-[#1c1c1e]/92 p-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="flex items-center justify-between px-1.5 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Mediciones
            </span>
            <button
              type="button"
              onClick={measure.clearMeasurements}
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
              title="Borrar todas"
            >
              <Trash2 size={12} />
            </button>
          </div>
          {measure.measurements.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[11px] text-neutral-200"
            >
              <span className="truncate">
                {m.kind === "distance" && fmtMm(m.value)}
                {m.kind === "radius" && `R${m.radius.toFixed(1)} · ⌀${(m.radius * 2).toFixed(1)}`}
                {m.kind === "angle" && `${m.degrees.toFixed(1)}°`}
                {m.kind === "area" && `${(m.area / 1_000_000).toFixed(4)}m²`}
              </span>
              <button
                type="button"
                onClick={() => measure.removeMeasurement(m.id)}
                className="shrink-0 rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

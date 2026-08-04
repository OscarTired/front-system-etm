"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"

import { CanvasToolbar } from "./components/canvas-toolbar"
import { drawScene } from "./utils/draw"
import { buildToolpath, computeLayerList, piecesToEntities } from "./utils/entities"
import { fmtMm } from "./utils/geometry-utils"
import { hitTestPieceAt } from "./utils/hit-test"
import {
  buildCollisionIndex,
  resolveDragOffset,
  type CollisionIndex,
  type SnapGuide,
} from "./utils/collision"
import { findNearestSnap } from "./utils/snap"
import type { DxfCanvasProps, Entity, Point, SnapCandidate } from "./types/types"
import { constrainToMode } from "../../utils/transform-mode"
import { useCanvasView } from "./hooks/use-canvas-view"
import { useMeasurements } from "./hooks/use-measurements"
import { useSimulation } from "./hooks/use-simulation"

export type { NestingPieceInput, LayerInfo, DxfCanvasProps } from "./types/types"
export { computeLayerList } from "./utils/entities"

type PieceDragState = {
  pieceIndices: number[]
  startLocal: Point
  /** Offset actual en coords mundo — se lee en cada frame de draw sin clonar entidades. */
  offset: Point
}

export function DxfCanvas({
  pieces,
  sheetSize,
  selectedPieceIndices = [],
  onSelectPiece,
  hiddenKeys,
  collidingPieceIndices = [],
  onMovePieces,
  onRotateSelected,
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

  /** Un solo objeto mutable: el draw lee pieceDragRef.current sin realloc. */
  const pieceDragRef = useRef<PieceDragState | null>(null)
  /** Espacio mantenido → pan de vista (estilo CAD), no mueve piezas. */
  const spaceHeldRef = useRef(false)
  /** Índice espacial de colisión — se reconstruye solo cuando cambian pieces. */
  const collisionIndexRef = useRef<CollisionIndex | null>(null)
  /** Guías de snap magnético del frame actual (draw las lee sin setState). */
  const snapGuidesRef = useRef<SnapGuide[]>([])

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setCursor = (c: string) => {
      canvas.style.cursor = c
    }

    const onPointerDown = (e: PointerEvent) => {
      const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
      if (!rawPoint) return

      // Botón medio o Espacio+drag = pan de vista (no mueve piezas)
      const forcePan = spaceHeldRef.current || e.button === 1
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

      if (measure.activeTool === "none") {
        const hit = hitTestPieceAt(entitiesRef.current, rawPoint, view.viewRef.current.scale)

        // Arrastre de pieza(s) ya seleccionadas
        if (hit !== null && selectedPieceIndices.includes(hit)) {
          pieceDragRef.current = {
            pieceIndices: [...selectedPieceIndices],
            startLocal: rawPoint,
            offset: { x: 0, y: 0 },
          }
          canvas.setPointerCapture(e.pointerId)
          setCursor("move")
          return
        }

        // Clic en pieza no seleccionada: posible selección en pointerUp;
        // registramos drag de vista pero si no se mueve, será click.
        draggingRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: view.viewRef.current.offsetX,
          startOffsetY: view.viewRef.current.offsetY,
          moved: false,
        }
        canvas.setPointerCapture(e.pointerId)
        if (hit === null) setCursor("grabbing")
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
      const pieceDrag = pieceDragRef.current
      pieceDragRef.current = null
      if (pieceDrag) {
        const { offset, pieceIndices } = pieceDrag
        // SIEMPRE confirmar el offset ya clampeado en el drag.
        // No revalidar aquí: el contacto borde-borde es válido y
        // un segundo test con floats distintos provocaba el "snap back".
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
    transformMode,
    scheduleDraw,
    pieces,
    sheetSize,
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === "Space") {
        e.preventDefault()
        spaceHeldRef.current = true
        return
      }
      if (e.key === "Escape") {
        onSelectPiece?.(null, false)
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
  }, [selectedPieceIndices, onRotateSelected, rotationStep, onSelectPiece])

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
      <canvas ref={canvasRef} className="h-full w-full touch-none" style={{ cursor: "default" }} />

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
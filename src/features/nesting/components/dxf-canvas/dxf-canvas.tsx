"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Ruler, AlertTriangle, Trash2, X, MousePointer2, Hand, Maximize2, RotateCw, Focus, CircleSlash, HelpCircle, Move, MoveHorizontal } from "lucide-react"
// Ruler used in measurements panel
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
import { findSmartSpansAtPoint } from "./utils/geometry-utils"
import { hitTestPieceAt, piecesInBox, hitTestDimensionLine } from "./utils/hit-test"
import {
  buildCollisionIndex,
  resolveDragOffset,
  type CollisionIndex,
  type SnapGuide,
} from "./utils/collision"
import { findNearestSnap, findSmartSnap } from "./utils/snap"
import type { DxfCanvasProps, Entity, Point, SnapCandidate } from "./types/types"
import { resolveAxisLock } from "../../utils/transform-mode"
import { useCanvasView } from "./hooks/use-canvas-view"
import { useMeasurements, measurementsFromBBox, applyOrthoConstraint } from "./hooks/use-measurements"
import { useSimulation } from "./hooks/use-simulation"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

export type { NestingPieceInput, LayerInfo, DxfCanvasProps } from "./types/types"
export { computeLayerList } from "./utils/entities"

type PieceDragState = {
  pieceIndices: number[]
  startLocal: Point
  offset: Point
  /**
   * Eje bloqueado en modo "geometric" (movimiento restringido a 1 eje).
   * Se decide UNA vez, al primer movimiento con distancia suficiente
   * desde el punto de inicio, y se mantiene fijo hasta soltar el drag.
   * Antes se recalculaba en cada pointermove comparando dx/dy
   * acumulados — cerca de la diagonal (45°) un jitter mínimo del mouse
   * hacía que el eje "ganador" cambiara de golpe entre X e Y en medio
   * del arrastre, y la pieza se veía "tambalear" saltando de eje.
   */
  axisLock: "x" | "y" | null
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
  onTransformModeChange,
  rotationStep = 90,
  sheetKey,
}: DxfCanvasProps) {
  const { isCompact } = useResponsive()
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
  /**
   * Drag para "jalar" una cota de distancia ya colocada y moverla lejos
   * de la geometría, como en un plano real (AutoCAD/SolidWorks: la cota
   * queda clicable/arrastrable después de puesta, no fija para siempre
   * en el offset que tenía al momento del 2º click).
   */
  const measurementDragRef = useRef<{
    id: string
    a: Point
    b: Point
  } | null>(null)
  const lockedPieceIndicesRef = useRef<number[]>(lockedPieceIndices)
  lockedPieceIndicesRef.current = lockedPieceIndices
  const spaceHeldRef = useRef(false)
  /** Pointers activos para pan/pinch táctil (pointerId → client coords). */
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{
    startDist: number
    startScale: number
    startOffsetX: number
    startOffsetY: number
    midX: number
    midY: number
  } | null>(null)
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select")
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; pieceIndex: number | null } | null>(null)
  const [showCanvasHelp, setShowCanvasHelp] = useState(false)
  const [statusActionsOpen, setStatusActionsOpen] = useState(false)
  const hasSelection = selectedPieceIndices.length > 0
  // Mismo patrón que el auto-open del canvas-toolbar (ver ese archivo):
  // al seleccionar algo se muestran las acciones de una vez, y al
  // deseleccionar se cierran para no dejar un hueco vacío abierto en el
  // pill. Es "ajustar estado cuando cambia una prop derivada" — se
  // podría evitar el efecto llevando `statusActionsOpen` a puramente
  // derivado (`open = hasSelection`), pero eso le quitaría al usuario
  // la posibilidad de colapsar las acciones manualmente sin perder la
  // selección, que es justo lo que este pill ofrece.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusActionsOpen(hasSelection)
  }, [hasSelection])

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
  const [gridStyle, setGridStyle] = useState<"dots" | "lines" | "cross" | "none">(isCompact ? "lines" : "dots")
  const [snapCandidate, setSnapCandidate] = useState<SnapCandidate | null>(null)
  /** Spans H/V por raycast en el polígono bajo el cursor (cota inteligente). */
  const [smartSpans, setSmartSpans] = useState<{
    h: { a: { x: number; y: number }; b: { x: number; y: number }; value: number } | null
    v: { a: { x: number; y: number }; b: { x: number; y: number }; value: number } | null
    center: { x: number; y: number }
  } | null>(null)
  /**
   * Contorno bajo el cursor con la herramienta de área activa. Antes
   * esta herramienta era la única sin ningún feedback visual al pasar
   * el mouse (las demás muestran el círculo amarillo de snap) — como
   * el área trabaja sobre un contorno completo, no un punto, se
   * resalta el contorno entero en vez de un punto de snap.
   */
  const [areaHoverContour, setAreaHoverContour] = useState<Point[] | null>(null)

  const view = useCanvasView()
  const sim = useSimulation()
  const measure = useMeasurements()

  // Al cambiar de plancha/pestaña, las mediciones (coords de mundo de
  // una plancha específica) ya no tienen sentido geométrico — se
  // limpian. La herramienta activa NO se desactiva (ver
  // resetMeasurementsOnly): seguir en modo regla al cambiar de pestaña
  // es una preferencia de flujo de trabajo, no un dato de esa plancha.
  // No se ejecuta al montar (sheetKey siempre "cambia" desde undefined
  // la primera vez) porque en ese punto no hay nada que limpiar todavía.
  const sheetKeyRef = useRef(sheetKey)
  useEffect(() => {
    if (sheetKeyRef.current === sheetKey) return
    sheetKeyRef.current = sheetKey
    measure.resetMeasurementsOnly()
  }, [sheetKey, measure])

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
        smartSpans,
        areaHoverContour,
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
    smartSpans,
    areaHoverContour,
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
      // No pisar zoom/pan del usuario (medir, acercar detalle, pinch, etc.)
      if (!view.hasUserInteracted()) {
        view.fitToSheetOrEntities(canvasRef.current, entities, sheetSize, isCompact)
      }
      scheduleDraw()
    })
    // `view` y `sim` ahora son estables (memoizados en sus hooks), así
    // que sí pueden ir en las deps sin causar reruns de más.
    // `scheduleDraw` queda afuera A PROPÓSITO: su identidad cambia por
    // razones que NO deberían disparar este efecto pesado (selección,
    // mediciones activas, estilo de grilla, etc. — ver sus propias deps
    // más arriba). Este efecto solo debe reconstruir colisiones/entidades/
    // toolpath y reajustar la cámara cuando cambian las piezas, el
    // tamaño de la plancha o las capas ocultas; siempre usa la versión
    // más reciente de scheduleDraw vía closure, sin necesitar re-ejecutarse
    // por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, sheetSize, hiddenKeys, view, sim])

  useEffect(() => {
    scheduleDraw()
  }, [scheduleDraw, sim.progress])

  // Al cambiar el tamaño del contenedor (rotación, sheet panel, teclado
  // móvil) re-fit: si no, el scale queda del tamaño anterior y se ve
  // la plancha chica con hueco negro.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let raf = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const canvasEl = canvasRef.current
        if (!canvasEl) return
        // No resetear zoom/pan del usuario (medir, acercar a un detalle, etc.)
        if (!view.hasUserInteracted()) {
          view.fitToSheetOrEntities(canvasEl, entitiesRef.current, sheetSize, isCompact)
        }
        scheduleDraw()
      })
    })
    observer.observe(container)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [scheduleDraw, view, sheetSize, isCompact])

  // Al entrar/salir de layout compacto, reorientar plancha (solo si el usuario no ha interactuado).
  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    if (!view.hasUserInteracted()) {
      view.fitToSheetOrEntities(canvasEl, entitiesRef.current, sheetSize, isCompact)
    }
    scheduleDraw()
  }, [isCompact, sheetSize, view, scheduleDraw])

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

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      // 2+ dedos: iniciar pinch-zoom (móvil/tablet)
      if (pointersRef.current.size === 2) {
        const pts = [...pointersRef.current.values()]
        const dx = pts[1].x - pts[0].x
        const dy = pts[1].y - pts[0].y
        const dist = Math.hypot(dx, dy) || 1
        const midX = (pts[0].x + pts[1].x) / 2
        const midY = (pts[0].y + pts[1].y) / 2
        pinchRef.current = {
          startDist: dist,
          startScale: view.viewRef.current.scale,
          startOffsetX: view.viewRef.current.offsetX,
          startOffsetY: view.viewRef.current.offsetY,
          midX,
          midY,
        }
        // Cancelar pan/drag de 1 dedo
        draggingRef.current = null
        pieceDragRef.current = null
        boxSelectRef.current = null
        zoomWindowRef.current = null
        setBoxSelectScreen(null)
        canvas.setPointerCapture(e.pointerId)
        return
      }

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
        // Agarrar una cota YA colocada para reposicionarla (jalar el
        // offset, como en un plano real). Va antes del hit-test de
        // piezas: si la línea de cota está encima de una pieza, gana
        // la cota, porque es lo más específico que el usuario puede
        // estar apuntando a esa altura de zoom.
        const measurementHit = hitTestDimensionLine(
          measure.measurements,
          rawPoint,
          view.viewRef.current.scale,
        )
        if (measurementHit) {
          measurementDragRef.current = {
            id: measurementHit.id,
            a: measurementHit.a,
            b: measurementHit.b,
          }
          canvas.setPointerCapture(e.pointerId)
          setCursor("move")
          return
        }

        const hit = hitTestPieceAt(entitiesRef.current, rawPoint, view.viewRef.current.scale)

        if (hit !== null && selectedPieceIndices.includes(hit)) {
          const locked = new Set(lockedPieceIndicesRef.current)
          const movable = selectedPieceIndices.filter((i) => !locked.has(i))
          if (movable.length === 0) return
          pieceDragRef.current = {
            pieceIndices: movable,
            startLocal: rawPoint,
            offset: { x: 0, y: 0 },
            axisLock: null,
          }
          canvas.setPointerCapture(e.pointerId)
          setCursor("move")
          return
        }

        if (hit === null && canvasTool === "select") {
          // Móvil/tablet: arrastrar en vacío = pan (más natural que box-select).
          // Desktop: box-select como antes.
          if (isCompact) {
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
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }

      // Arrastrando una cota ya colocada: recalcular su offset según
      // la posición actual del cursor, igual que el cálculo de offset
      // del 2º click al ponerla por primera vez.
      if (measurementDragRef.current) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (rawPoint) {
          const { id, a, b } = measurementDragRef.current
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.hypot(dx, dy) || 1
          const nx = -dy / len
          const ny = dx / len
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
          const offset = (rawPoint.x - mid.x) * nx + (rawPoint.y - mid.y) * ny
          measure.updateMeasurementOffset(id, offset)
          scheduleDraw()
        }
        return
      }

      // Pinch zoom + pan de 2 dedos
      if (pinchRef.current && pointersRef.current.size >= 2) {
        const pts = [...pointersRef.current.values()]
        const dx = pts[1].x - pts[0].x
        const dy = pts[1].y - pts[0].y
        const dist = Math.hypot(dx, dy) || 1
        const midX = (pts[0].x + pts[1].x) / 2
        const midY = (pts[0].y + pts[1].y) / 2
        const pinch = pinchRef.current
        const factor = dist / pinch.startDist
        const newScale = Math.min(200, Math.max(0.01, pinch.startScale * factor))

        // Zoom hacia el punto medio de los dedos
        const rect = canvas.getBoundingClientRect()
        const cx = midX - rect.left - rect.width / 2
        const cy = midY - rect.top - rect.height / 2
        const scaleRatio = newScale / pinch.startScale
        // Pan: mover el centro según el desplazamiento del midpoint
        const midDx = midX - pinch.midX
        const midDy = midY - pinch.midY

        view.markUserInteracted()
        view.viewRef.current = {
          scale: newScale,
          offsetX: pinch.startOffsetX * scaleRatio + cx * (1 - scaleRatio) + midDx,
          offsetY: pinch.startOffsetY * scaleRatio + cy * (1 - scaleRatio) + midDy,
          rotationDeg: view.viewRef.current.rotationDeg ?? 0,
        }
        scheduleDraw()
        return
      }

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

      if (measure.activeTool !== "none" && measure.activeTool !== "smart") {
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
            ? findSmartSnap(entitiesRef.current, rawPoint, view.viewRef.current.scale, sheetSize)
            : null
        setSnapCandidate(snap)
        setSmartSpans(null)

        if (measure.activeTool === "area" && rawPoint) {
          setAreaHoverContour(measure.hitTestClosedContour(entitiesRef.current, rawPoint))
        } else {
          setAreaHoverContour(null)
        }

        let hoverPt = snap ? snap.point : rawPoint
        // Con 1 punto pendiente en distancia: proyectar hover a H/V si está cerca
        // (las guías dashed se dibujan en draw.ts con el mismo criterio).
        if (
          measure.activeTool === "distance" &&
          measure.pendingPoints.length === 1 &&
          hoverPt
        ) {
          hoverPt = applyOrthoConstraint(measure.pendingPoints[0], hoverPt, {
            force: e.shiftKey,
          })
        }
        measure.setHoverLocal(hoverPt)
        measure.setHoverScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        scheduleDraw()
      }

      const pieceDrag = pieceDragRef.current
      if (pieceDrag) {
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (rawPoint) {
          let wantDx = rawPoint.x - pieceDrag.startLocal.x
          let wantDy = rawPoint.y - pieceDrag.startLocal.y
          const axisResult = resolveAxisLock(transformMode, wantDx, wantDy, pieceDrag.axisLock)
          wantDx = axisResult.dx
          wantDy = axisResult.dy
          pieceDrag.axisLock = axisResult.lock
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
        // Sin herramienta: no mostrar cotas fantasma. Se llama siempre
        // al setter (no se lee smartSpans/snapCandidate, que no están
        // en las deps de este efecto a propósito) — inofensivo si ya
        // son null, y evita depender de un closure con valor obsoleto.
        setSnapCandidate(null)
        setSmartSpans(null)
        setAreaHoverContour(null)
      }

      // Cota inteligente: SOLO con la herramienta "smart" activa.
      // Sin clics: solo posicionar el puntero sobre arista o centro del objeto.
      if (measure.activeTool === "smart" && !draggingRef.current) {
        setCursor("crosshair")
        // Mismo criterio que snapCandidate/smartSpans: no leer el
        // valor actual (closure obsoleto, areaHoverContour no está en
        // las deps de este efecto a propósito). Llamar siempre al
        // setter es inofensivo si ya es null.
        setAreaHoverContour(null)
        const rawPoint = view.screenToLocal(canvas, e.clientX, e.clientY)
        if (!rawPoint) return
        const scale = view.viewRef.current.scale
        const edgeSnap = findSmartSnap(entitiesRef.current, rawPoint, scale, sheetSize)

        let preferEdge = false
        if (edgeSnap?.segment) {
          const { a, b } = edgeSnap.segment
          const vx = b.x - a.x
          const vy = b.y - a.y
          const len2 = vx * vx + vy * vy || 1
          let tt = ((rawPoint.x - a.x) * vx + (rawPoint.y - a.y) * vy) / len2
          tt = Math.max(0, Math.min(1, tt))
          const proj = { x: a.x + tt * vx, y: a.y + tt * vy }
          const distPx = Math.hypot(rawPoint.x - proj.x, rawPoint.y - proj.y) * scale
          preferEdge = distPx < 10
        }

        // Prioridad: si el puntero está DENTRO de un contorno → cruz H/V.
        // Solo si no hay span interior, caer a cota de arista.
        const spans = findSmartSpansAtPoint(entitiesRef.current, rawPoint)
        if (spans && (spans.h || spans.v)) {
          setSnapCandidate(null)
          setSmartSpans(spans)
          measure.setHoverLocal(rawPoint)
        } else if (preferEdge && edgeSnap) {
          setSnapCandidate(edgeSnap)
          setSmartSpans(null)
          measure.setHoverLocal(edgeSnap.point)
        } else if (edgeSnap) {
          setSnapCandidate(edgeSnap)
          setSmartSpans(null)
          measure.setHoverLocal(edgeSnap.point)
        } else {
          setSnapCandidate(null)
          setSmartSpans(null)
          measure.setHoverLocal(rawPoint)
        }
        const rect = canvas.getBoundingClientRect()
        measure.setHoverScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        scheduleDraw()
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
      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size < 2) {
        pinchRef.current = null
      }

      if (measurementDragRef.current) {
        measurementDragRef.current = null
        setCursor("default")
        scheduleDraw()
        return
      }

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

        if (measure.activeTool !== "none" && measure.activeTool !== "coords" && measure.activeTool !== "smart") {
          const usesPointSnap =
            measure.activeTool === "distance" ||
            measure.activeTool === "angle" ||
            measure.activeTool === "radius"
          const snap =
            snapEnabled && usesPointSnap
              ? findSmartSnap(entitiesRef.current, rawPoint!, view.viewRef.current.scale, sheetSize)
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
    isCompact,
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
    view.allowAutoFit()
    view.fitToSheetOrEntities(canvasRef.current, entitiesRef.current, sheetSize, isCompact)
    scheduleDraw()
  }, [view, sheetSize, isCompact, scheduleDraw])

  const handleFocus = useCallback(() => {
    view.allowAutoFit()
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
    // No apilar: si ya hay cotas bbox activas, no añadir más
    if (measure.measurements.some((m) => m.id.startsWith("bbox-"))) return

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const i of selectedPieceIndices) {
      const piece = pieces[i]
      if (!piece) continue
      const pts =
        piece.outline && piece.outline.length
          ? piece.outline
          : (piece.subOutlines ?? []).flatMap((s) => s.points)
      for (const pt of pts) {
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
  }, [selectedPieceIndices, onRotateSelected, rotationStep, onSelectPiece, measure, onDeleteSelected])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: "#0a0a0c" }}
    >
      <canvas ref={canvasRef} className="h-full w-full touch-none select-none" style={{ cursor: "default" }} />

      {/* Barra de estado inferior. Cuando hay selección, el texto "N
          piezas" es tappable/clickable y expande las acciones (misma
          técnica de max-w+opacity que el FAB de canvas-toolbar.tsx) —
          antes esto vivía DUPLICADO: este pill solo mostraba el conteo,
          y en nesting-page.tsx había otra barra completa aparte, siempre
          expandida, con "X · N sel. · Eliminar · Rotar+90/-90" debajo
          del canvas. Se fusionaron en un solo lugar. */}
      <div
        data-slot="canvas-status-bar"
        className={`absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-[#101012]/95 py-1.5 text-xs text-neutral-400 shadow-lg backdrop-blur-sm ${
          isCompact ? "px-2.5" : "px-3"
        }`}
      >
        {selectedPieceIndices.length > 0 ? (
          <button
            type="button"
            onClick={() => setStatusActionsOpen((v) => !v)}
            className="min-w-22 text-left text-neutral-200 hover:text-white"
            aria-expanded={statusActionsOpen}
            title={statusActionsOpen ? "Ocultar acciones" : "Ver acciones"}
          >
            {selectedPieceIndices.length === 1
              ? "1 pieza"
              : `${selectedPieceIndices.length} piezas`}
          </button>
        ) : (
          <span className="min-w-22 text-neutral-200">Sin selección</span>
        )}
        {collidingPieceIndices.length > 0 && (
          <>
            <span className="text-white/15">|</span>
            <span className="text-red-400 font-medium">
              {collidingPieceIndices.length} colisión{collidingPieceIndices.length === 1 ? "" : "es"}
            </span>
          </>
        )}

        {/* Acciones de selección — mismo patrón de expansión (max-w +
            opacity) que el panel principal del canvas-toolbar. */}
        {selectedPieceIndices.length > 0 && (
          <div
            className={`flex items-center gap-0.5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              statusActionsOpen ? "max-w-80 opacity-100" : "max-w-0 opacity-0 pointer-events-none"
            }`}
          >
            <span className="text-white/15">|</span>
            <button
              type="button"
              onClick={() => onSelectPiece?.(null, false)}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
              title="Deseleccionar"
            >
              <CircleSlash size={13} />
            </button>
            <button
              type="button"
              disabled={!onDeleteSelected}
              onClick={() => onDeleteSelected?.(selectedPieceIndices)}
              className="rounded-full p-1.5 text-red-400 hover:bg-red-500/15 disabled:pointer-events-none disabled:opacity-30"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
            <div className="mx-0.5 h-4 w-px shrink-0 bg-white/10" />
            <button
              type="button"
              disabled={!onRotateSelected}
              onClick={() => onRotateSelected?.(selectedPieceIndices, rotationStep)}
              className="whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              +{rotationStep}°
            </button>
            <button
              type="button"
              disabled={!onRotateSelected}
              onClick={() => onRotateSelected?.(selectedPieceIndices, -rotationStep)}
              className="whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              −{rotationStep}°
            </button>
            <button
              type="button"
              onClick={() => setCanvasTool("rotate")}
              className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium hover:bg-white/10 hover:text-white ${
                canvasTool === "rotate" ? "bg-cyan-500/20 text-cyan-300" : "text-neutral-300"
              }`}
              title="Rotar libre arrastrando (Shift = pasos de 15°)"
            >
              Libre
            </button>
          </div>
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

      {/* Indicador modo interacción V/H superior — única fuente de verdad
          del modo activo (antes se repetía también en la barra de estado). */}
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-[#101012]/90 p-1 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            title="Seleccionar (V)"
            onClick={() => setCanvasTool("select")}
            className={`flex h-8 items-center gap-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              isCompact ? "w-8 justify-center px-0" : "px-2.5"
            } ${
              canvasTool === "select"
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            {!isCompact && "V"}
          </button>
          <button
            type="button"
            title="Pan (H)"
            onClick={() => setCanvasTool("pan")}
            className={`flex h-8 items-center gap-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              isCompact ? "w-8 justify-center px-0" : "px-2.5"
            } ${
              canvasTool === "pan"
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
            {!isCompact && "H"}
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
            {/* Siempre primero: ajustar a plancha */}
            <DropdownMenuItem onClick={() => handleFit()}>
              <Maximize2 className="mr-2 h-4 w-4 opacity-70" />
              Ajustar a plancha
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
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
                  onClick={() => setCanvasTool("rotate")}
                >
                  <RotateCw className="mr-2 h-4 w-4 opacity-70" />
                  Rotar libre (arrastrar)
                  <span className="ml-auto text-[10px] text-neutral-500">Shift = 15°</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedPieceIndices.length === 0}
                  onClick={() => handleFocus()}
                >
                  <Focus className="mr-2 h-4 w-4 opacity-70" />
                  Enfocar selección
                </DropdownMenuItem>
                {onTransformModeChange && (
                  <DropdownMenuItem
                    onClick={() =>
                      onTransformModeChange(transformMode === "free" ? "geometric" : "free")
                    }
                  >
                    {transformMode === "free" ? (
                      <MoveHorizontal className="mr-2 h-4 w-4 opacity-70" />
                    ) : (
                      <Move className="mr-2 h-4 w-4 opacity-70" />
                    )}
                    {transformMode === "free" ? "Restringir a un eje" : "Movimiento libre"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={selectedPieceIndices.length === 0}
                  onClick={() => onSelectPiece?.(null, false)}
                >
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
                {onTransformModeChange && (
                  <DropdownMenuItem
                    onClick={() =>
                      onTransformModeChange(transformMode === "free" ? "geometric" : "free")
                    }
                  >
                    {transformMode === "free" ? (
                      <MoveHorizontal className="mr-2 h-4 w-4 opacity-70" />
                    ) : (
                      <Move className="mr-2 h-4 w-4 opacity-70" />
                    )}
                    {transformMode === "free"
                      ? "Restringir movimiento a un eje"
                      : "Activar movimiento libre"}
                  </DropdownMenuItem>
                )}
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
        transformMode={transformMode}
        onTransformModeChange={onTransformModeChange}
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
          {measure.activeTool === "smart" &&
            "Cota inteligente: acerca el puntero al centro o a una arista (sin clic)"}
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
        <div
          className="absolute bottom-14 left-3 z-30 flex max-h-[40%] w-[min(18rem,calc(100%-1.5rem))] flex-col gap-1.5 overflow-y-auto rounded-2xl bg-[#141416]/95 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md themed-scrollbar-y sm:p-3"
          title="Mediciones activas"
        >
          <div className="flex items-center justify-between gap-2 px-0.5 pb-0.5">
            <span className="hidden min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-neutral-400 xs:inline sm:inline">
              Mediciones
            </span>
            <span className="inline text-neutral-400 sm:hidden" aria-hidden>
              <Ruler size={14} />
            </span>
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500">
                {measure.measurements.length}
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
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            {measure.measurements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10"
              >
                <span className="min-w-0 truncate font-medium">
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
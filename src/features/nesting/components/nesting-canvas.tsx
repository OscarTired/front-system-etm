"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react"
import { boundingRect } from "../engine/geometry"
import type { PlacedPiece } from "../engine/types"

export interface NestingCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  fitToView: () => void
}

export interface NestingCanvasProps {
  sheetWidth: number
  sheetHeight: number
  pieces: PlacedPiece[]
  selectedPieceIndex: number | null
  onSelectPiece: (index: number | null) => void
  className?: string
}

interface ViewState {
  scale: number
  offsetX: number
  offsetY: number
}

interface Point {
  x: number
  y: number
}

const SHEET_FILL = "#d4d4d8" // gris claro, como pediste
const SHEET_STROKE = "#71717a"
const BACKGROUND = "#0a0a0c" // oscuro industrial
const SELECTED_HALO = "#facc15"
const SELECTED_STROKE = "#ffffff"

/** Ray casting estándar: ¿el punto está dentro del polígono? */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

function hitTestPiece(point: Point, piece: PlacedPiece): boolean {
  // Probamos contra cada sub-entidad cerrada (agujeros/contorno reales)
  // si existen; si no, contra el outline fusionado. Cualquier trazo
  // que contenga el punto cuenta como hit — es una aproximación
  // razonable sin reconstruir qué trazo es el contorno exterior real.
  const outlines = piece.subEntities?.length ? piece.subEntities.map((s) => s.outline) : [piece.outline]
  return outlines.some((o) => o.points.length >= 3 && pointInPolygon(point, o.points))
}

export const NestingCanvas = forwardRef<NestingCanvasHandle, NestingCanvasProps>(function NestingCanvas(
  { sheetWidth, sheetHeight, pieces, selectedPieceIndex, onSelectPiece, className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 })
  const draggingRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number; moved: boolean } | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const { scale, offsetX, offsetY } = viewRef.current
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(w / 2 + offsetX, h / 2 + offsetY)
    ctx.scale(scale, scale)

    // Plancha
    ctx.fillStyle = SHEET_FILL
    ctx.fillRect(0, 0, sheetWidth, sheetHeight)
    ctx.strokeStyle = SHEET_STROKE
    ctx.lineWidth = 1 / scale
    ctx.strokeRect(0, 0, sheetWidth, sheetHeight)

    pieces.forEach((piece, i) => {
      const isSelected = i === selectedPieceIndex

      if (piece.subEntities && piece.subEntities.length > 0) {
        for (const sub of piece.subEntities) {
          ctx.strokeStyle = isSelected ? SELECTED_STROKE : sub.color ?? piece.color ?? "#22c55e"
          ctx.lineWidth = (isSelected ? 1.8 : 0.8) / scale
          ctx.beginPath()
          sub.outline.points.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
          ctx.stroke()
        }
      } else {
        const color = piece.color ?? "#22c55e"
        ctx.fillStyle = color + "33"
        ctx.strokeStyle = isSelected ? SELECTED_STROKE : color
        ctx.lineWidth = (isSelected ? 1.8 : 1) / scale
        ctx.beginPath()
        piece.outline.points.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      if (isSelected) {
        const b = boundingRect(piece.outline)
        const pad = 3 / scale
        ctx.strokeStyle = SELECTED_HALO
        ctx.lineWidth = 1 / scale
        ctx.setLineDash([4 / scale, 4 / scale])
        ctx.strokeRect(b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2)
        ctx.setLineDash([])
      }
    })

    ctx.restore()
  }, [sheetWidth, sheetHeight, pieces, selectedPieceIndex])

  const fitToView = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || sheetWidth <= 0 || sheetHeight <= 0) return

    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return

    const padding = 0.9
    const scale = Math.min((w / sheetWidth) * padding, (h / sheetHeight) * padding)

    viewRef.current = {
      scale,
      offsetX: -(sheetWidth / 2) * scale,
      offsetY: -(sheetHeight / 2) * scale,
    }
    draw()
  }, [sheetWidth, sheetHeight, draw])

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        viewRef.current = { ...viewRef.current, scale: viewRef.current.scale * 1.25 }
        draw()
      },
      zoomOut: () => {
        viewRef.current = { ...viewRef.current, scale: viewRef.current.scale * 0.8 }
        draw()
      },
      fitToView,
    }),
    [draw, fitToView]
  )

  // Encaja a la vista cuando cambia la plancha activa (nueva plancha seleccionada, o primera carga).
  useEffect(() => {
    requestAnimationFrame(fitToView)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetWidth, sheetHeight])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      draw()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [draw])

  // Convierte coordenadas de pantalla (clientX/clientY) a coordenadas de la plancha.
  const screenToSheet = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const { scale, offsetX, offsetY } = viewRef.current
    const cx = clientX - rect.left - rect.width / 2 - offsetX
    const cy = clientY - rect.top - rect.height / 2 - offsetY
    return { x: cx / scale, y: cy / scale }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: viewRef.current.offsetX,
        startOffsetY: viewRef.current.offsetY,
        moved: false,
      }
      canvas.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      const drag = draggingRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true
      viewRef.current = { ...viewRef.current, offsetX: drag.startOffsetX + dx, offsetY: drag.startOffsetY + dy }
      draw()
    }

    const onPointerUp = (e: PointerEvent) => {
      const drag = draggingRef.current
      draggingRef.current = null
      if (!drag || drag.moved) return // fue un pan, no un click

      const sheetPoint = screenToSheet(e.clientX, e.clientY)
      if (!sheetPoint) return

      // Recorremos de atrás para adelante: la última pieza dibujada
      // (la que se ve "encima" en un solapamiento) gana el hit test.
      for (let i = pieces.length - 1; i >= 0; i--) {
        if (hitTestPiece(sheetPoint, pieces[i])) {
          onSelectPiece(i)
          return
        }
      }
      onSelectPiece(null)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left - rect.width / 2
      const cy = e.clientY - rect.top - rect.height / 2
      const { scale, offsetX, offsetY } = viewRef.current
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      viewRef.current = {
        scale: scale * factor,
        offsetX: cx - (cx - offsetX) * factor,
        offsetY: cy - (cy - offsetY) * factor,
      }
      draw()
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
  }, [draw, pieces, onSelectPiece, screenToSheet])

  return (
    <div ref={containerRef} className={className ?? "relative h-full w-full"} style={{ backgroundColor: BACKGROUND }}>
      <canvas ref={canvasRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" />
    </div>
  )
})

import { useCallback, useRef } from "react"
import { computeBounds } from "../utils/geometry-utils"
import type { Entity, Point, ViewState } from "../types/types"

/**
 * Estado de cámara (zoom/pan) + helpers de transformación de coordenadas.
 * El view vive en un ref para no re-renderizar en cada frame de pan.
 */
export function useCanvasView() {
  const viewRef = useRef<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 })

  const localToScreen = useCallback((canvas: HTMLCanvasElement | null, p: Point): Point => {
    if (!canvas) return { x: 0, y: 0 }
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const { scale, offsetX, offsetY } = viewRef.current
    return {
      x: w / 2 + offsetX + p.x * scale,
      y: h / 2 + offsetY + p.y * scale,
    }
  }, [])

  const screenToLocal = useCallback(
    (canvas: HTMLCanvasElement | null, clientX: number, clientY: number): Point | null => {
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const { scale, offsetX, offsetY } = viewRef.current
      const cx = clientX - rect.left - rect.width / 2 - offsetX
      const cy = clientY - rect.top - rect.height / 2 - offsetY
      return { x: cx / scale, y: cy / scale }
    },
    []
  )

  const fitToBounds = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      bounds: { minX: number; minY: number; maxX: number; maxY: number } | null,
      padding = 0.9
    ) => {
      if (!canvas || !bounds) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return

      const drawW = bounds.maxX - bounds.minX || 1
      const drawH = bounds.maxY - bounds.minY || 1
      const scale = Math.min((w / drawW) * padding, (h / drawH) * padding)
      const centerX = (bounds.minX + bounds.maxX) / 2
      const centerY = (bounds.minY + bounds.maxY) / 2

      viewRef.current = {
        scale,
        offsetX: -centerX * scale,
        offsetY: -centerY * scale,
      }
    },
    []
  )

  const fitToSheetOrEntities = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      entities: Entity[],
      sheetSize?: { width: number; height: number }
    ) => {
      const bounds = sheetSize
        ? { minX: 0, minY: 0, maxX: sheetSize.width, maxY: sheetSize.height }
        : computeBounds(entities)
      fitToBounds(canvas, bounds, 0.9)
    },
    [fitToBounds]
  )

  const focusEntities = useCallback(
    (canvas: HTMLCanvasElement | null, entities: Entity[], padding = 0.6) => {
      fitToBounds(canvas, computeBounds(entities), padding)
    },
    [fitToBounds]
  )

  const zoomAt = useCallback(
    (canvas: HTMLCanvasElement | null, clientX: number, clientY: number, factor: number) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cx = clientX - rect.left - rect.width / 2
      const cy = clientY - rect.top - rect.height / 2
      const { scale, offsetX, offsetY } = viewRef.current
      const newScale = scale * factor
      viewRef.current = {
        scale: newScale,
        offsetX: cx - (cx - offsetX) * factor,
        offsetY: cy - (cy - offsetY) * factor,
      }
    },
    []
  )

  const zoomBy = useCallback((factor: number) => {
    viewRef.current = {
      ...viewRef.current,
      scale: viewRef.current.scale * factor,
    }
  }, [])

  const panBy = useCallback((dx: number, dy: number, startOffsetX: number, startOffsetY: number) => {
    viewRef.current = {
      ...viewRef.current,
      offsetX: startOffsetX + dx,
      offsetY: startOffsetY + dy,
    }
  }, [])

  return {
    viewRef,
    localToScreen,
    screenToLocal,
    fitToSheetOrEntities,
    focusEntities,
    zoomAt,
    zoomBy,
    panBy,
  }
}

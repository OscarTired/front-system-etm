import { useCallback, useMemo, useRef } from "react"
import { computeBounds } from "../utils/geometry-utils"
import type { Entity, Point, ViewState } from "../types/types"

/**
 * Estado de cámara (zoom/pan) + helpers de transformación de coordenadas.
 * El view vive en un ref para no re-renderizar en cada frame de pan.
 */
export function useCanvasView() {
  const viewRef = useRef<ViewState>({ scale: 1, offsetX: 0, offsetY: 0, rotationDeg: 0 })

  const localToScreen = useCallback((canvas: HTMLCanvasElement | null, p: Point): Point => {
    if (!canvas) return { x: 0, y: 0 }
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const { scale, offsetX, offsetY, rotationDeg = 0 } = viewRef.current
    let lx = p.x * scale
    let ly = p.y * scale
    if (rotationDeg === 90) {
      const rx = -ly
      const ry = lx
      lx = rx
      ly = ry
    }
    return {
      x: w / 2 + offsetX + lx,
      y: h / 2 + offsetY + ly,
    }
  }, [])

  const screenToLocal = useCallback(
    (canvas: HTMLCanvasElement | null, clientX: number, clientY: number): Point | null => {
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      // Con zoom de página, rect.width puede diferir de clientWidth;
      // normalizamos a espacio CSS del layout del canvas.
      const cssW = canvas.clientWidth || rect.width
      const cssH = canvas.clientHeight || rect.height
      const sx = cssW / (rect.width || 1)
      const sy = cssH / (rect.height || 1)
      const { scale, offsetX, offsetY, rotationDeg = 0 } = viewRef.current
      let cx = (clientX - rect.left) * sx - cssW / 2 - offsetX
      let cy = (clientY - rect.top) * sy - cssH / 2 - offsetY
      if (rotationDeg === 90) {
        // inversa de rotate(π/2): (x,y) → (y, -x)
        const ix = cy
        const iy = -cx
        cx = ix
        cy = iy
      }
      return { x: cx / scale, y: cy / scale }
    },
    []
  )

  const fitToBounds = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      bounds: { minX: number; minY: number; maxX: number; maxY: number } | null,
      padding = 0.9,
      opts?: { preferPortrait?: boolean; allowAutoRotate?: boolean }
    ) => {
      if (!canvas || !bounds) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return

      const drawW = bounds.maxX - bounds.minX || 1
      const drawH = bounds.maxY - bounds.minY || 1

      // Móvil / viewport vertical + plancha ancha → girar vista 90°.
      // preferPortrait (isCompact) fuerza el criterio aunque el canvas
      // aún no haya medido bien el alto en el primer frame.
      const canvasPortrait = h >= w * 0.95 || Boolean(opts?.preferPortrait)
      const sheetLandscape = drawW > drawH * 1.05
      const allow = opts?.allowAutoRotate !== false
      const rotationDeg: 0 | 90 =
        allow && canvasPortrait && sheetLandscape ? 90 : 0

      const scale =
        rotationDeg === 90
          ? Math.min((w / drawH) * padding, (h / drawW) * padding)
          : Math.min((w / drawW) * padding, (h / drawH) * padding)

      const centerX = (bounds.minX + bounds.maxX) / 2
      const centerY = (bounds.minY + bounds.maxY) / 2
      let ox = -centerX * scale
      let oy = -centerY * scale
      if (rotationDeg === 90) {
        // offset en espacio ya rotado (mismo que localToScreen)
        const rx = -centerY * scale
        const ry = centerX * scale
        ox = -rx
        oy = -ry
      }

      viewRef.current = {
        scale,
        offsetX: ox,
        offsetY: oy,
        rotationDeg,
      }
    },
    []
  )

  const fitToSheetOrEntities = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      entities: Entity[],
      sheetSize?: { width: number; height: number },
      preferPortrait = false,
    ) => {
      const bounds = sheetSize
        ? { minX: 0, minY: 0, maxX: sheetSize.width, maxY: sheetSize.height }
        : computeBounds(entities)
      // preferPortrait (móvil): menos padding → la plancha llena más pantalla
      fitToBounds(canvas, bounds, preferPortrait ? 0.96 : 0.9, {
        allowAutoRotate: true,
        preferPortrait,
      })
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
        rotationDeg: viewRef.current.rotationDeg ?? 0,
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

  return useMemo(
    () => ({
      viewRef,
      localToScreen,
      screenToLocal,
      fitToBounds,
      fitToSheetOrEntities,
      focusEntities,
      zoomAt,
      zoomBy,
      panBy,
    }),
    [
      localToScreen,
      screenToLocal,
      fitToBounds,
      fitToSheetOrEntities,
      focusEntities,
      zoomAt,
      zoomBy,
      panBy,
    ],
  )
}

"use client"

import {
  useCallback,
  useEffect,
  useRef,
} from "react"

const DRAG_THRESHOLD = 6
const DRAG_SPEED = 1.2
const WHEEL_MULTIPLIER = 3.5

const DRAG_SCROLL_IGNORE_SELECTOR =
  "[data-drag-scroll-ignore]"

export const PIPELINE_SCROLL_INTERACTION_EVENT =
  "pipeline-scroll-interaction"

function notifyScrollInteraction() {
  window.dispatchEvent(
    new Event(PIPELINE_SCROLL_INTERACTION_EVENT),
  )
}

function clearBodyDragStyles() {
  document.body.style.removeProperty("user-select")
  document.body.style.removeProperty("cursor")
}

/**
 * Drag horizontal en un contenedor overflow-x.
 *
 * Importante:
 * - NO marca drag en el primer mousedown (evita body locked si un
 *   Popover/portal se traga el mouseup).
 * - Listeners de move/up en window mientras el gesture está activo.
 * - Cleanup total en unmount / pointercancel / blur.
 */
export function useDragScroll() {
  const containerRef = useRef<HTMLDivElement>(null)

  /** Gesture empezó (mousedown), aún no supera threshold. */
  const armed = useRef(false)
  /** Ya superó threshold → drag real. */
  const isDragging = useRef(false)
  const dragged = useRef(false)
  const suppressClick = useRef(false)

  const startX = useRef(0)
  const startScrollLeft = useRef(0)

  const stopDragging = useCallback(() => {
    if (dragged.current) {
      suppressClick.current = true
      window.setTimeout(() => {
        suppressClick.current = false
      }, 200)
    }

    armed.current = false
    isDragging.current = false
    dragged.current = false
    clearBodyDragStyles()
  }, [])

  const onWindowMove = useCallback((event: MouseEvent) => {
    if (!armed.current) return
    const container = containerRef.current
    if (!container) return

    const deltaX = event.clientX - startX.current

    if (!isDragging.current) {
      if (Math.abs(deltaX) <= DRAG_THRESHOLD) return
      isDragging.current = true
      dragged.current = true
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"
      notifyScrollInteraction()
    }

    container.scrollLeft =
      startScrollLeft.current - deltaX * DRAG_SPEED
  }, [])

  const onWindowUp = useCallback(() => {
    stopDragging()
  }, [stopDragging])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.closest(DRAG_SCROLL_IGNORE_SELECTOR)) return

    const container = containerRef.current
    if (!container) return

    // Armar, no drag todavía — body no se toca hasta threshold.
    armed.current = true
    isDragging.current = false
    dragged.current = false
    startX.current = event.clientX
    startScrollLeft.current = container.scrollLeft
  }, [])

  // Move en el nodo sigue siendo útil; window cubre salida del nodo.
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!armed.current) return
    onWindowMove(event.nativeEvent)
  }, [onWindowMove])

  const handleClickCapture = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.closest(DRAG_SCROLL_IGNORE_SELECTOR)) return
    if (suppressClick.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", onWindowMove)
    window.addEventListener("mouseup", onWindowUp)
    window.addEventListener("pointercancel", onWindowUp)
    window.addEventListener("blur", onWindowUp)
    return () => {
      window.removeEventListener("mousemove", onWindowMove)
      window.removeEventListener("mouseup", onWindowUp)
      window.removeEventListener("pointercancel", onWindowUp)
      window.removeEventListener("blur", onWindowUp)
      // Si el componente se desmonta a mitad de un drag (p.ej. popover),
      // no dejar body con user-select/cursor pegados.
      clearBodyDragStyles()
      armed.current = false
      isDragging.current = false
      dragged.current = false
    }
  }, [onWindowMove, onWindowUp])

  useEffect(() => {
    // Ref puede ser null en el primer effect (board aún en loading) y
    // montarse después: re-sincronizamos hasta tener nodo.
    let frame = 0
    let notified = false
    let attached: HTMLDivElement | null = null

    const handleWheel = (event: WheelEvent) => {
      const container = attached
      if (!container) return

      const canScrollH =
        container.scrollWidth > container.clientWidth + 1
      if (!canScrollH) return

      // Sobre la zona horizontal: rueda vertical → scroll X (sin Shift).
      const primarilyHorizontal =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      const delta = primarilyHorizontal
        ? event.deltaX
        : event.deltaY * WHEEL_MULTIPLIER

      if (Math.abs(delta) < 0.01) return

      const atStart = container.scrollLeft <= 0
      const atEnd =
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 1
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) {
        return
      }

      event.preventDefault()

      if (!notified) {
        notifyScrollInteraction()
        notified = true
        window.setTimeout(() => {
          notified = false
        }, 250)
      }

      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        container.scrollLeft += delta
      })
    }

    const sync = () => {
      const el = containerRef.current
      if (el === attached) return
      if (attached) {
        attached.removeEventListener("wheel", handleWheel)
      }
      attached = el
      if (attached) {
        attached.addEventListener("wheel", handleWheel, { passive: false })
      }
    }

    sync()
    const interval = window.setInterval(sync, 120)

    return () => {
      window.clearInterval(interval)
      cancelAnimationFrame(frame)
      if (attached) {
        attached.removeEventListener("wheel", handleWheel)
      }
    }
  }, [])

  return {
    containerRef,
    isDragging,
    dragged,
    suppressClick,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  }
}

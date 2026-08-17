"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Props = React.ComponentPropsWithoutRef<"div"> & {
  orientation?: "vertical" | "horizontal" | "both"
  /** false = thumb oculto (default). true = .native-scrollbar */
  showScrollbar?: boolean
  /**
   * Arrastre con puntero (mouse) para pan — solo complementa el nativo.
   * No intercepta wheel/touch: eso lo hace el browser.
   */
  dragToScroll?: boolean
}

const ScrollArea = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      className,
      orientation = "vertical",
      showScrollbar = false,
      dragToScroll = false,
      onPointerDown,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const drag = React.useRef<{
      pointerId: number
      x: number
      y: number
      left: number
      top: number
      moved: boolean
    } | null>(null)

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event)
      if (!dragToScroll || event.button !== 0) return
      // No iniciar drag desde controles interactivos
      const t = event.target as HTMLElement
      if (t.closest("button, a, input, textarea, select, [role='button'], [data-drag-scroll-ignore]")) {
        return
      }
      const el = localRef.current
      if (!el) return
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: el.scrollLeft,
        top: el.scrollTop,
        moved: false,
      }
      el.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = drag.current
      const el = localRef.current
      if (!s || !el || event.pointerId !== s.pointerId) return
      const dx = event.clientX - s.x
      const dy = event.clientY - s.y
      if (!s.moved && Math.hypot(dx, dy) < 4) return
      s.moved = true
      if (orientation === "horizontal" || orientation === "both") {
        el.scrollLeft = s.left - dx
      }
      if (orientation === "vertical" || orientation === "both") {
        el.scrollTop = s.top - dy
      }
    }

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = drag.current
      const el = localRef.current
      if (!s || event.pointerId !== s.pointerId) return
      drag.current = null
      try {
        el?.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
    }

    /**
     * Nested scroll (comunidad): el eje dominante manda.
     * - deltaX / shift+rueda → horizontal
     * - rueda vertical pura → NO preventDefault (sube al padre vertical)
     * Nunca convertir Y→X: eso es el conflicto en ProjectTasksList.
     */
    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
      if (orientation === "vertical") return
      const el = localRef.current
      if (!el) return

      const absX = Math.abs(event.deltaX)
      const absY = Math.abs(event.deltaY)
      const shiftAsHorizontal = event.shiftKey && absY > 0
      const primarilyHorizontal = absX > absY

      if (!primarilyHorizontal && !shiftAsHorizontal) return
      if (el.scrollWidth <= el.clientWidth + 1) return

      const delta = primarilyHorizontal ? event.deltaX : event.deltaY
      if (Math.abs(delta) < 0.5) return

      const max = el.scrollWidth - el.clientWidth
      const next = Math.min(max, Math.max(0, el.scrollLeft + delta))
      if (next === el.scrollLeft) return

      el.scrollLeft = next
      event.preventDefault()
    }

    return (
      <div
        ref={setRefs}
        data-slot="scroll-area"
        onPointerDown={handlePointerDown}
        onPointerMove={dragToScroll ? handlePointerMove : undefined}
        onPointerUp={dragToScroll ? endDrag : undefined}
        onPointerCancel={dragToScroll ? endDrag : undefined}
        onWheel={handleWheel}
        className={cn(
          "min-h-0 min-w-0",
          orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
          orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
          orientation === "both" && "overflow-auto",
          dragToScroll && "cursor-grab active:cursor-grabbing",
          showScrollbar
            ? "native-scrollbar"
            : "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
        {...props}
      />
    )
  },
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }

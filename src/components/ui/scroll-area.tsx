"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Props = React.ComponentPropsWithoutRef<"div"> & {
  orientation?: "vertical" | "horizontal" | "both"
  /** false = thumb oculto (default). true = .native-scrollbar */
  showScrollbar?: boolean
  /**
   * Arrastre con puntero (mouse). Touch y trackpad siguen nativos.
   */
  dragToScroll?: boolean
  /**
   * Solo orientation="horizontal". Si true, rueda vertical → scroll X
   * (kanban / process board). Default false para no robar scroll vertical.
   */
  mapVerticalWheel?: boolean
}

/**
 * Scroll nativo.
 *
 * Rueda (orientation="horizontal"):
 * - Rueda vertical del mouse → scroll X (carrusel / kanban).
 * - Trackpad con deltaX → scroll X.
 * - Se registra con { passive: false } (React onWheel es passive en
 *   Chromium y preventDefault no aplica).
 *
 * orientation="both"|vertical: no se intercepta la rueda (nativo).
 */
const ScrollArea = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      className,
      orientation = "vertical",
      showScrollbar = false,
      dragToScroll = false,
      mapVerticalWheel = false,
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

    // Wheel con listener nativo no-passive (React onWheel no sirve aquí).
    React.useEffect(() => {
      const el = localRef.current
      if (!el) return
      if (orientation !== "horizontal") return

      const onWheel = (event: WheelEvent) => {
        if (el.scrollWidth <= el.clientWidth + 1) return

        const absX = Math.abs(event.deltaX)
        const absY = Math.abs(event.deltaY)

        // Trackpad X o shift+rueda siempre.
        // mapVerticalWheel: rueda vertical → X (kanban / process board).
        const isHorizontalIntent =
          absX > absY ||
          (event.shiftKey && absY > 0) ||
          (mapVerticalWheel && absY > 0)
        if (!isHorizontalIntent) return

        const delta = absX > absY ? event.deltaX : event.deltaY
        if (Math.abs(delta) < 0.5) return

        const max = el.scrollWidth - el.clientWidth
        const next = Math.min(max, Math.max(0, el.scrollLeft + delta))
        if (next === el.scrollLeft) return

        el.scrollLeft = next
        event.preventDefault()
      }

      el.addEventListener("wheel", onWheel, { passive: false })
      return () => el.removeEventListener("wheel", onWheel)
    }, [orientation, mapVerticalWheel])

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event)
      if (!dragToScroll || event.button !== 0) return
      const t = event.target as HTMLElement
      if (
        t.closest(
          "button, a, input, textarea, select, [role='button'], [role='menuitem'], [data-radix-collection-item], [data-drag-scroll-ignore]",
        )
      ) {
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

    return (
      <div
        ref={setRefs}
        data-slot="scroll-area"
        onPointerDown={handlePointerDown}
        onPointerMove={dragToScroll ? handlePointerMove : undefined}
        onPointerUp={dragToScroll ? endDrag : undefined}
        onPointerCancel={dragToScroll ? endDrag : undefined}
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

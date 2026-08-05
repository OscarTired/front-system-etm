"use client"

import * as React from "react"
import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

const ARROW_SCROLL_STEP = 240
const FADE_MIN = 12
const FADE_MAX = 40
const DRAG_THRESHOLD = 4

type Orientation = "vertical" | "horizontal"

export interface ScrollAreaProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onScroll"> {
  orientation?: Orientation
  showArrows?: boolean
  contentClassName?: string
}

function ScrollArea({
  className,
  contentClassName,
  children,
  orientation = "vertical",
  showArrows = true,
  ...props
}: ScrollAreaProps) {
  const { isCompact } = useResponsive()
  const isHorizontal = orientation === "horizontal"
  const containerRef = useRef<HTMLDivElement>(null)

  const [hovering, setHovering] = useState(false)
  const [fade, setFade] = useState({ start: 0, end: 0 })
  const [canScrollStart, setCanScrollStart] = useState(false)
  const [canScrollEnd, setCanScrollEnd] = useState(false)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const scrollPos = isHorizontal ? el.scrollLeft : el.scrollTop
    const clientSize = isHorizontal ? el.clientWidth : el.clientHeight
    const scrollSize = isHorizontal ? el.scrollWidth : el.scrollHeight
    const maxScroll = Math.max(scrollSize - clientSize, 0)

    if (maxScroll <= 0) {
      setFade({ start: 0, end: 0 })
      setCanScrollStart(false)
      setCanScrollEnd(false)
      return
    }

    const fadeSize = Math.min(
      Math.max(Math.round(clientSize * 0.06), FADE_MIN),
      FADE_MAX,
    )

    setFade({
      start: Math.min(scrollPos, fadeSize),
      end: Math.min(maxScroll - scrollPos, fadeSize),
    })
    setCanScrollStart(scrollPos > 0)
    setCanScrollEnd(scrollPos < maxScroll - 1)
  }, [isHorizontal])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    measure()
    el.addEventListener("scroll", measure, { passive: true })

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)

    return () => {
      el.removeEventListener("scroll", measure)
      observer.disconnect()
    }
  }, [measure])

  const dragRef = useRef({ dragging: false, dragged: false, startX: 0, startScrollLeft: 0 })
  const suppressClickRef = useRef(false)

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isHorizontal) return
    const el = containerRef.current
    if (!el) return
    dragRef.current = {
      dragging: true,
      dragged: false,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
    }
    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
  }, [isHorizontal])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isHorizontal) return
    const el = containerRef.current
    const state = dragRef.current
    if (!state.dragging || !el) return
    const delta = event.clientX - state.startX
    if (Math.abs(delta) > DRAG_THRESHOLD) state.dragged = true
    el.scrollLeft = state.startScrollLeft - delta
  }, [isHorizontal])

  const stopDragging = useCallback(() => {
    if (!isHorizontal) return
    if (dragRef.current.dragged) {
      suppressClickRef.current = true
      window.setTimeout(() => { suppressClickRef.current = false }, 200)
    }
    dragRef.current.dragging = false
    document.body.style.userSelect = ""
    document.body.style.cursor = ""
  }, [isHorizontal])

  const handleClickCapture = useCallback((event: React.MouseEvent) => {
    if (suppressClickRef.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  useLayoutEffect(() => {
    if (!isHorizontal) return
    const el = containerRef.current
    if (!el) return

    let frame = 0
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      const delta = event.deltaY
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { el.scrollLeft += delta })
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener("wheel", handleWheel)
    }
  }, [isHorizontal])

  const scrollByStep = useCallback((direction: -1 | 1) => {
    const el = containerRef.current
    if (!el) return
    el.scrollBy(
      isHorizontal
        ? { left: direction * ARROW_SCROLL_STEP, behavior: "smooth" }
        : { top: direction * ARROW_SCROLL_STEP, behavior: "smooth" },
    )
  }, [isHorizontal])

  const maskImage = isHorizontal
    ? `linear-gradient(to right, transparent 0, black ${fade.start}px, black calc(100% - ${fade.end}px), transparent 100%)`
    : `linear-gradient(to bottom, transparent 0, black ${fade.start}px, black calc(100% - ${fade.end}px), transparent 100%)`

  const showStartArrow = showArrows && isCompact && hovering && canScrollStart
  const showEndArrow = showArrows && isCompact && hovering && canScrollEnd

  const StartIcon = isHorizontal ? ChevronLeft : ChevronUp
  const EndIcon = isHorizontal ? ChevronRight : ChevronDown

  return (
    <div
      data-slot="scroll-area"
      className={cn("relative h-full w-full overflow-hidden", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      {...props}
    >
      {showArrows && (
        <>
          <button
            type="button"
            aria-label={isHorizontal ? "Scrollear izquierda" : "Scrollear arriba"}
            tabIndex={-1}
            onClick={() => scrollByStep(-1)}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
            className={cn(
              "absolute z-20 flex items-center justify-center rounded-lg bg-[#18181b]/60 backdrop-blur-xl text-neutral-200 transition-opacity duration-200 hover:bg-[#18181b]",
              isHorizontal
                ? "left-2 top-1/2 h-7 w-8 -translate-y-1/2"
                : "left-1/2 top-2 h-6 w-8 -translate-x-1/2",
              showStartArrow ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
          >
            <StartIcon size={13} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            aria-label={isHorizontal ? "Scrollear derecha" : "Scrollear abajo"}
            tabIndex={-1}
            onClick={() => scrollByStep(1)}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
            className={cn(
              "absolute z-20 flex items-center justify-center rounded-lg bg-[#18181b]/60 backdrop-blur-xl text-neutral-200 transition-opacity duration-200 hover:bg-[#18181b]",
              isHorizontal
                ? "right-2 top-1/2 h-7 w-8 -translate-y-1/2"
                : "left-1/2 bottom-2 h-6 w-8 -translate-x-1/2",
              showEndArrow ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
          >
            <EndIcon size={13} strokeWidth={2.5} />
          </button>
        </>
      )}

      <div style={{ WebkitMaskImage: maskImage, maskImage }} className="h-full w-full">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onClickCapture={handleClickCapture}
          className={cn(
            "h-full w-full",
            isCompact
              ? "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              : isHorizontal
              ? "themed-scrollbar-x"
              : "themed-scrollbar-y",
            isHorizontal
              ? "cursor-grab select-none overflow-x-auto overflow-y-hidden active:cursor-grabbing"
              : "overflow-y-auto overflow-x-hidden",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// Mantenido solo por compatibilidad con los call sites que ya
// renderizaban <ScrollBar /> como hijo explícito (patrón de Radix:
// <ScrollArea>...<ScrollBar/></ScrollArea>). El ScrollArea nuevo no
// usa un thumb sintético — el scroll es nativo del navegador,
// estilizado vía las clases .themed-scrollbar-x/y en globals.css —
// así que esto no necesita renderizar nada. Se puede borrar de a
// poco de cada call site cuando se toque ese archivo por otra razón.
function ScrollBar(_: React.ComponentProps<"div"> & { orientation?: Orientation }) {
  void _
  return null
}

export { ScrollArea, ScrollBar }
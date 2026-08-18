"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { ProcessBoardNavButton } from "./process-board-nav-button"
import { useProcessBoardOverflow } from "./use-process-board-overflow"
import type { ProcessBoardColumn } from "./process-board.types"

type Props<TId extends string = string> = {
  columns: ProcessBoardColumn<TId>[]
  /** Ancho de columna desktop (debe coincidir con scrollStep − gap). */
  columnClassName?: string
  /**
   * Paso de scroll por columna en desktop (px).
   * w-72 (288) + gap-3 (12) = 300 — snap columna a columna.
   */
  scrollStep?: number
  className?: string
  header?: ReactNode
  loading?: boolean
  loadingFallback?: ReactNode
  showArrows?: boolean
  arrowsOnHover?: boolean
}

/**
 * Board horizontal compartido.
 *
 * Eje X: ScrollArea + drag + rueda→X + flechas.
 * Snap: CSS scroll-snap + corrección en scrollend (columna completa, no parcial).
 * Eje Y: ProcessBoardColumnFrame (body).
 */
export function ProcessBoard<TId extends string = string>({
  columns,
  columnClassName = "w-72 min-w-72 shrink-0",
  scrollStep = 300,
  className,
  header,
  loading,
  loadingFallback,
  showArrows = true,
  arrowsOnHover = true,
}: Props<TId>) {
  const { isMobile } = useResponsive()
  const [hovering, setHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { canScrollLeft, canScrollRight } = useProcessBoardOverflow(
    containerRef,
    [columns.length, isMobile, loading],
  )

  const showLeft =
    showArrows &&
    canScrollLeft &&
    (isMobile || !arrowsOnHover || hovering)
  const showRight =
    showArrows &&
    canScrollRight &&
    (isMobile || !arrowsOnHover || hovering)

  function stepPx(el: HTMLDivElement) {
    return isMobile ? el.clientWidth : scrollStep
  }

  function currentIndex() {
    const el = containerRef.current
    if (!el) return 0
    return Math.round(el.scrollLeft / stepPx(el))
  }

  function goToIndex(index: number) {
    const el = containerRef.current
    if (!el) return
    const next = Math.max(0, Math.min(columns.length - 1, index))
    el.scrollTo({
      left: next * stepPx(el),
      behavior: "smooth",
    })
  }

  function snapToNearest() {
    const el = containerRef.current
    if (!el) return
    const step = stepPx(el)
    if (step <= 0) return
    const target = Math.round(el.scrollLeft / step) * step
    if (Math.abs(el.scrollLeft - target) < 1) return
    el.scrollTo({ left: target, behavior: "smooth" })
  }

  // Snap al soltar scroll (drag, rueda, trackpad). Comunidad: CSS snap + scrollend.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScrollEnd = () => snapToNearest()
    el.addEventListener("scrollend", onScrollEnd)

    // Fallback browsers sin scrollend: debounce scroll
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      if (typeof (window as unknown as { onscrollend?: unknown }).onscrollend !== "undefined")
        return
      clearTimeout(timer)
      timer = setTimeout(snapToNearest, 100)
    }
    el.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      el.removeEventListener("scrollend", onScrollEnd)
      el.removeEventListener("scroll", onScroll)
      clearTimeout(timer)
    }
  }, [isMobile, scrollStep, columns.length])

  const prevLen = useRef(columns.length)
  useEffect(() => {
    if (prevLen.current === columns.length) return
    prevLen.current = columns.length
    containerRef.current?.scrollTo({ left: 0 })
  }, [columns.length])

  if (loading) {
    return (
      loadingFallback ?? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Cargando…
        </div>
      )
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-1 flex-col select-none",
        className,
      )}
    >
      {header ? <div className="mb-3 shrink-0">{header}</div> : null}

      <div
        className="relative min-h-0 w-full flex-1"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <ProcessBoardNavButton
          direction="left"
          visible={showLeft}
          onClick={() => goToIndex(currentIndex() - 1)}
          label="Columna anterior"
        />
        <ProcessBoardNavButton
          direction="right"
          visible={showRight}
          onClick={() => goToIndex(currentIndex() + 1)}
          label="Columna siguiente"
        />

        <ScrollArea
          ref={containerRef}
          orientation="horizontal"
          dragToScroll
          mapVerticalWheel
          className="h-full min-h-0 w-full"
        >
          {/*
            snap-x mandatory + snap-start/always: cada columna es una “página”.
            Desktop usa gap vía margin en columnas (incluido en scrollStep).
          */}
          <div
            className={cn(
              "flex h-full min-h-0 snap-x snap-mandatory",
            )}
          >
            {columns.map((col, i) => (
              <div
                key={col.id}
                className={cn(
                  "flex h-full min-h-0 shrink-0 snap-start snap-always flex-col",
                  isMobile
                    ? "w-full min-w-full"
                    : cn(columnClassName, i < columns.length - 1 && "mr-3"),
                )}
              >
                {col.content}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

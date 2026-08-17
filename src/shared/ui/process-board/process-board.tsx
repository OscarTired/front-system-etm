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
  columnClassName?: string
  scrollStep?: number
  className?: string
  header?: ReactNode
  loading?: boolean
  loadingFallback?: ReactNode
  showArrows?: boolean
  arrowsOnHover?: boolean
}

/**
 * Board horizontal compartido (pipeline + ingeniería).
 *
 * Altura (causa raíz del “corte” desktop):
 * - Raíz min-h-0 flex-1 flex-col
 * - Track h-full
 * - Cada columna: h-full min-h-0 overflow-y-auto
 * Padre debe ser flex + min-h-0 + overflow-hidden.
 */
export function ProcessBoard<TId extends string = string>({
  columns,
  columnClassName = "w-72 min-w-72 shrink-0",
  scrollStep = 288,
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

  function currentIndex() {
    const el = containerRef.current
    if (!el) return 0
    if (isMobile) return Math.round(el.scrollLeft / (el.clientWidth || 1))
    return Math.round(el.scrollLeft / scrollStep)
  }

  function goToIndex(index: number) {
    const el = containerRef.current
    if (!el) return
    const next = Math.max(0, Math.min(columns.length - 1, index))
    el.scrollTo({
      left: isMobile ? next * el.clientWidth : next * scrollStep,
      behavior: "smooth",
    })
  }

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
        "relative flex min-h-0 w-full flex-1 flex-col select-none",
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
          <div
            className={cn(
              "flex h-full min-h-0",
              isMobile ? "snap-x snap-mandatory" : "gap-3",
            )}
          >
            {columns.map(col => (
              <div
                key={col.id}
                className={cn(
                  "flex h-full min-h-0 shrink-0 flex-col overflow-y-auto overscroll-contain",
                  isMobile
                    ? "w-full min-w-full snap-center [touch-action:pan-y]"
                    : columnClassName,
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

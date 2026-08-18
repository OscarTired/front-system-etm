"use client"

import { useEffect, useRef, type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { ProcessBoardNavButton } from "./process-board-nav-button"
import { useProcessBoardOverflow } from "./use-process-board-overflow"
import type { ProcessBoardColumn } from "./process-board.types"

type Props<TId extends string = string> = {
  columns: ProcessBoardColumn<TId>[]
  columnClassName?: string
  className?: string
  header?: ReactNode
  loading?: boolean
  loadingFallback?: ReactNode
  showArrows?: boolean
}

/**
 * Board horizontal.
 * Snap: CSS scroll-snap (sin step mágico).
 * Flechas: hermanos del track + scrollIntoView.
 */
export function ProcessBoard<TId extends string = string>({
  columns,
  columnClassName = "w-72 min-w-72 shrink-0",
  className,
  header,
  loading,
  loadingFallback,
  showArrows = true,
}: Props<TId>) {
  const { isMobile } = useResponsive()
  const containerRef = useRef<HTMLDivElement>(null)

  const { canScrollLeft, canScrollRight } = useProcessBoardOverflow(
    containerRef,
    [columns.length, isMobile, loading],
  )

  function columnEls() {
    const root = containerRef.current
    if (!root) return [] as HTMLElement[]
    return Array.from(
      root.querySelectorAll<HTMLElement>("[data-process-board-col]"),
    )
  }

  function currentIndex() {
    const el = containerRef.current
    const cols = columnEls()
    if (!el || cols.length === 0) return 0
    const left = el.scrollLeft
    let best = 0
    let bestDist = Infinity
    cols.forEach((col, i) => {
      const d = Math.abs(col.offsetLeft - left)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  }

  function goToIndex(index: number) {
    const cols = columnEls()
    if (cols.length === 0) return
    const next = Math.max(0, Math.min(cols.length - 1, index))
    cols[next]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
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
        "relative flex h-full min-h-0 w-full flex-1 flex-col select-none",
        className,
      )}
    >
      {header ? <div className="mb-3 shrink-0">{header}</div> : null}

      <div className="flex min-h-0 w-full flex-1 items-stretch gap-1">
        {showArrows && (
          <ProcessBoardNavButton
            direction="left"
            visible={canScrollLeft}
            onClick={() => goToIndex(currentIndex() - 1)}
            label="Columna anterior"
          />
        )}

        <ScrollArea
          ref={containerRef}
          orientation="horizontal"
          dragToScroll
          mapVerticalWheel
          className="h-full min-h-0 min-w-0 flex-1"
        >
          <div className="flex h-full min-h-0 snap-x snap-mandatory gap-3">
            {columns.map(col => (
              <div
                key={col.id}
                data-process-board-col
                className={cn(
                  "flex h-full min-h-0 shrink-0 snap-start snap-always flex-col",
                  isMobile ? "w-full min-w-full" : columnClassName,
                )}
              >
                {col.content}
              </div>
            ))}
          </div>
        </ScrollArea>

        {showArrows && (
          <ProcessBoardNavButton
            direction="right"
            visible={canScrollRight}
            onClick={() => goToIndex(currentIndex() + 1)}
            label="Columna siguiente"
          />
        )}
      </div>
    </div>
  )
}

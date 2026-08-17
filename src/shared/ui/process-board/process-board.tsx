"use client"

import { useState, type ReactNode } from "react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
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
  /** true (default): flechas solo al hover en desktop, igual TaskPipeline. */
  arrowsOnHover?: boolean
}

export function ProcessBoard<TId extends string = string>({
  columns,
  columnClassName = "w-72 min-w-72 shrink-0",
  scrollStep = 288,
  className,
  header,
  loading,
  loadingFallback,
  arrowsOnHover = true,
}: Props<TId>) {
  const { isMobile } = useResponsive()
  const [hovering, setHovering] = useState(false)

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  const { canScrollLeft, canScrollRight, leftFade, rightFade } =
    useProcessBoardOverflow(containerRef, [
      columns.length,
      isMobile,
      loading,
    ])

  const showLeft =
    canScrollLeft && (!arrowsOnHover || isMobile || hovering)
  const showRight =
    canScrollRight && (!arrowsOnHover || isMobile || hovering)

  function currentIndex() {
    const el = containerRef.current
    if (!el) return 0
    if (isMobile) {
      return Math.round(el.scrollLeft / (el.clientWidth || 1))
    }
    return Math.round(el.scrollLeft / scrollStep)
  }

  function goToIndex(index: number) {
    const el = containerRef.current
    if (!el) return
    const max = columns.length - 1
    const next = Math.max(0, Math.min(max, index))
    el.scrollTo({
      left: isMobile ? next * el.clientWidth : next * scrollStep,
      behavior: "smooth",
    })
  }

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
      {header}

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

        <div
          className="h-full min-h-0 overflow-hidden"
          style={{
            WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
            maskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
          }}
        >
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onClickCapture={handleClickCapture}
            className={cn(
              "hide-scrollbar flex h-full min-h-0 select-none",
              isMobile
                ? "snap-x snap-mandatory overflow-x-auto overflow-y-hidden [touch-action:pan-x]"
                : "gap-3 overflow-x-auto overflow-y-hidden pb-2",
            )}
          >
            {columns.map(col => (
              <div
                key={col.id}
                className={cn(
                  "flex shrink-0 flex-col",
                  isMobile
                    ? "w-full snap-center [touch-action:pan-y]"
                    : columnClassName,
                )}
              >
                {col.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

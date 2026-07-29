"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { cn } from "@/shared/utils/utils"
import { CollapsibleSummaryPanel } from "@/shared/ui/collapsible-summary-panel/collapsible-summary-panel"

const SCROLL_SETTLE_DELAY = 300
const KPI_FADE_SIZE = 24

type SummaryValue = {
  label: string
  value: string | number
}

type Summary = {
  icon: LucideIcon
  color: string
  label: string
  values: [SummaryValue, SummaryValue]
}

type Props = {
  cards: React.ReactNode[]
  summary: Summary
  defaultExpanded?: boolean
}

export function KpiCarousel({ cards, summary, defaultExpanded = false }: Props) {
  const { isMobile } = useResponsive()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const [leftFade, setLeftFade] = useState(0)
  const [rightFade, setRightFade] = useState(0)

  const [isScrolling, setIsScrolling] = useState(false)
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  const updateArrows = useCallback(() => {
    const el = containerRef.current
    if (!el) {
      return
    }

    const { scrollLeft, clientWidth, scrollWidth } = el

    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(
      scrollLeft + clientWidth < scrollWidth - 4
    )

    const maxScroll = Math.max(scrollWidth - clientWidth, 0)

    if (maxScroll <= 0) {
      setLeftFade(0)
      setRightFade(0)
      return
    }

    setLeftFade(Math.min(scrollLeft, KPI_FADE_SIZE))
    setRightFade(Math.min(maxScroll - scrollLeft, KPI_FADE_SIZE))
  }, [containerRef])

  useEffect(() => {
    if (!isMobile || !expanded) {
      return
    }

    const el = containerRef.current
    if (!el) {
      return
    }

    updateArrows()

    function handleScroll() {
      updateArrows()
      setIsScrolling(true)

      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current)
      }

      settleTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, SCROLL_SETTLE_DELAY)
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    const observer = new ResizeObserver(updateArrows)
    observer.observe(el)

    return () => {
      el.removeEventListener("scroll", handleScroll)
      observer.disconnect()

      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current)
      }
    }
  }, [updateArrows, containerRef, isMobile, expanded])

  function scrollLeft() {
    const el = containerRef.current
    el?.scrollBy({
      left: -el.clientWidth * 0.75,
      behavior: "smooth",
    })
  }

  function scrollRight() {
    const el = containerRef.current
    el?.scrollBy({
      left: el.clientWidth * 0.75,
      behavior: "smooth",
    })
  }

  const textColor = getBadgeColors(summary.color, "subtle").text
  const Icon = summary.icon

  const showLeftArrow = isScrolling && canScrollLeft
  const showRightArrow = isScrolling && canScrollRight

  return (
    <div className="flex w-full flex-col">
      <CollapsibleSummaryPanel
        expanded={expanded}
        onCollapse={() => setExpanded(false)}
        collapsed={
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:brightness-110 tablet:gap-4 tablet:p-4"
            style={{
              background: `linear-gradient(135deg, ${summary.color}20, #101012)`,
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
              <Icon size={20} style={{ color: textColor }} />
            </div>

            <span
              className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.18em] tablet:block"
              style={{ color: textColor }}
            >
              {summary.label}
            </span>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-6 tablet:gap-8">
              {summary.values.map((v) => (
                <div key={v.label} className="min-w-0 text-right">
                  <p className="truncate text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    {v.label}
                  </p>
                  <p
                    className="text-base sm:text-lg font-bold leading-tight"
                    style={{ color: textColor }}
                  >
                    {v.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-400">
              <MoreHorizontal size={18} />
            </div>
          </button>
        }
      >
        {!isMobile ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 laptop:grid-cols-4">
            {cards}
          </div>
        ) : (
          <div className="relative w-full">
            {/* Botón Izquierdo */}
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Anterior"
              tabIndex={-1}
              className={cn(
                "absolute left-1.5 top-1/2 z-20 -translate-y-1/2",
                "flex h-8 w-8 items-center justify-center rounded-full",
                "bg-[#18181b]/90 backdrop-blur-xl text-neutral-200 transition-opacity duration-200 shadow-lg border border-white/10",
                showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            {/* Botón Derecho */}
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Siguiente"
              tabIndex={-1}
              className={cn(
                "absolute right-1.5 top-1/2 z-20 -translate-y-1/2",
                "flex h-8 w-8 items-center justify-center rounded-full",
                "bg-[#18181b]/90 backdrop-blur-xl text-neutral-200 transition-opacity duration-200 shadow-lg border border-white/10",
                showRightArrow ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>

            {/* Contenedor con Máscara de Desvanecimiento */}
            <div
              style={{
                WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
                maskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
              className="w-full overflow-hidden py-1"
            >
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                onClickCapture={handleClickCapture}
                className="hide-scrollbar flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto overscroll-contain scroll-smooth px-2 cursor-grab select-none active:cursor-grabbing"
              >
                {cards.map((card, index) => (
                  <div
                    key={index}
                    className="w-[88%] sm:w-[70%] shrink-0 snap-center flex flex-col h-auto min-h-27.5"
                  >
                    <div className="flex-1 flex flex-col rounded-xl bg-white/3 p-1 transition-all *:h-full *:w-full">
                      {card}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CollapsibleSummaryPanel>
    </div>
  )
}
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { cn } from "@/shared/utils/utils"

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
    if (!el) return

    const { scrollLeft, clientWidth, scrollWidth } = el

    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)

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
    if (!isMobile || !expanded) return

    const el = containerRef.current
    if (!el) return

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
    el?.scrollBy({ left: -el.clientWidth, behavior: "smooth" })
  }

  function scrollRight() {
    const el = containerRef.current
    el?.scrollBy({ left: el.clientWidth, behavior: "smooth" })
  }

  const textColor = getBadgeColors(summary.color, "subtle").text
  const Icon = summary.icon

  const showLeftArrow = isScrolling && canScrollLeft
  const showRightArrow = isScrolling && canScrollRight

  return (
    <div className="flex w-full flex-col gap-2">
      {/* 1. ESTADO COLAPSADO (Con animación de cierre suave estilo iOS) */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          !expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
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

            <div className="flex min-w-0 flex-1 items-center justify-end gap-4 tablet:gap-8">
              {summary.values.map((v) => (
                <div key={v.label} className="min-w-0 text-right">
                  <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    {v.label}
                  </p>
                  <p
                    className="text-lg font-bold leading-tight"
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
        </div>
      </div>

      {/* 2. ESTADO EXPANDIDO (Con animación de apertura y cierre fluida) */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-white/10 hover:text-neutral-200 active:scale-95"
              >
                <ChevronUp size={14} strokeWidth={2.4} className="transition-transform duration-300" />
                Ocultar indicadores
              </button>
            </div>

            {!isMobile ? (
              <div className="grid grid-cols-2 gap-4 laptop:grid-cols-4">
                {cards}
              </div>
            ) : (
              <div className="relative h-44 w-full">
                <button
                  type="button"
                  onClick={scrollLeft}
                  aria-label="Anterior"
                  tabIndex={-1}
                  className={cn(
                    "absolute left-1 top-1/2 z-20 -translate-y-1/2",
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "bg-[#18181b]/80 backdrop-blur-xl text-neutral-200 transition-opacity duration-200",
                    showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <ChevronLeft size={15} strokeWidth={2.5} />
                </button>

                <button
                  type="button"
                  onClick={scrollRight}
                  aria-label="Siguiente"
                  tabIndex={-1}
                  className={cn(
                    "absolute right-1 top-1/2 z-20 -translate-y-1/2",
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "bg-[#18181b]/80 backdrop-blur-xl text-neutral-200 transition-opacity duration-200",
                    showRightArrow ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <ChevronRight size={15} strokeWidth={2.5} />
                </button>

                <div
                  style={{
                    WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
                    maskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                  }}
                  className="h-full overflow-hidden"
                >
                  <div
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDragging}
                    onMouseLeave={stopDragging}
                    onClickCapture={handleClickCapture}
                    className="hide-scrollbar flex h-full snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-contain scroll-smooth px-1 cursor-grab select-none active:cursor-grabbing"
                  >
                    {cards.map((card, index) => (
                      <div key={index} className="w-full shrink-0 snap-center">
                        {card}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
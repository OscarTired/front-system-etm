"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { cn } from "@/shared/utils/utils"

const KPI_FADE_SIZE = 24
const SCROLL_SETTLE_DELAY = 300

type Props = {
  cards: React.ReactNode[]
}

export function KpiPanel({ cards }: Props) {
  const { isMobile } = useResponsive()

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
    if (!isMobile) {
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
  }, [updateArrows, containerRef, isMobile])

  function scrollLeft() {
    const el = containerRef.current

    el?.scrollBy({
      left: -el.clientWidth,
      behavior: "smooth",
    })
  }

  function scrollRight() {
    const el = containerRef.current

    el?.scrollBy({
      left: el.clientWidth,
      behavior: "smooth",
    })
  }

  if (!isMobile) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}
      >
        {cards}
      </div>
    )
  }

  const showLeftArrow = isScrolling && canScrollLeft
  const showRightArrow = isScrolling && canScrollRight

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Anterior"
        tabIndex={-1}
        className={cn(
          "absolute left-1 top-1/2 z-20 -translate-y-1/2",
          "flex h-6 w-8 items-center justify-center rounded-full",
          "bg-neutral-900/80 shadow-lg shadow-black/30 backdrop-blur-xl text-neutral-200 transition-opacity duration-200",
          showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={scrollRight}
        aria-label="Siguiente"
        tabIndex={-1}
        className={cn(
          "absolute right-1 top-1/2 z-20 -translate-y-1/2",
          "flex h-6 w-8 items-center justify-center rounded-full",
          "bg-neutral-900/80 shadow-lg shadow-black/30 backdrop-blur-xl text-neutral-200 transition-opacity duration-200",
          showRightArrow ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight size={14} strokeWidth={2.5} />
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
        className="overflow-hidden"
      >
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onClickCapture={handleClickCapture}
          className="hide-scrollbar flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-contain scroll-smooth px-1 cursor-grab select-none active:cursor-grabbing"
        >
          {cards.map((card, index) => (
            <div key={index} className="w-full shrink-0 snap-center">
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
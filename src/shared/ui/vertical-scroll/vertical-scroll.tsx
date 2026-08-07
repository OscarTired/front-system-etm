"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

import { cn } from "@/shared/utils/utils"

const FADE_SIZE = 9

type Props = {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  style?: React.CSSProperties
  arrowTopOffset?: number
  arrowBottomOffset?: number
  arrowAlign?: "center" | "right"
  arrowClassName?: string
  /**
   * Cuando cambia (ej. pathname), scrollTop = 0 sin desmontar el contenedor.
   * Preferible a key={pathname} en el padre.
   */
  resetKey?: string
}

const ARROW_ALIGN_CLASSNAME: Record<"center" | "right", string> = {
  center: "left-1/2 -translate-x-1/2",
  right: "right-2",
}

function getMaskImage(canScrollUp: boolean, canScrollDown: boolean) {
  if (canScrollUp && canScrollDown) {
    return `linear-gradient(to bottom, transparent 0, black ${FADE_SIZE}px, black calc(100% - ${FADE_SIZE}px), transparent 100%)`
  }

  if (canScrollUp) {
    return `linear-gradient(to bottom, transparent 0, black ${FADE_SIZE}px, black 100%)`
  }

  if (canScrollDown) {
    return `linear-gradient(to bottom, black 0, black calc(100% - ${FADE_SIZE}px), transparent 100%)`
  }

  return "none"
}

export function VerticalScroll({
  children,
  className,
  containerClassName,
  style,
  arrowTopOffset = 4,
  arrowBottomOffset = 4,
  arrowAlign = "center",
  arrowClassName,
  resetKey,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  // Reset scroll al navegar sin remount (evita jank + listeners PTR muertos)
  useEffect(() => {
    if (resetKey === undefined) return
    const el = containerRef.current
    if (!el) return
    el.scrollTop = 0
  }, [resetKey])

  const updateArrows = useCallback(() => {
    const el = containerRef.current

    if (!el) {
      return
    }

    setCanScrollUp(el.scrollTop > 4)

    setCanScrollDown(
      el.scrollTop + el.clientHeight < el.scrollHeight - 4
    )
  }, [])

  useEffect(() => {
    const el = containerRef.current
    const contentEl = contentRef.current

    if (!el || !contentEl) {
      return
    }

    updateArrows()

    el.addEventListener("scroll", updateArrows, { passive: true })

    const observer = new ResizeObserver(updateArrows)

    observer.observe(el)
    observer.observe(contentEl)

    return () => {
      el.removeEventListener("scroll", updateArrows)
      observer.disconnect()
    }
  }, [updateArrows])

  // Modificado: Ahora mandan directo al inicio o al final sin pasarse de largo
  function scrollUp() {
    const el = containerRef.current
    if (!el) return

    el.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function scrollDown() {
    const el = containerRef.current
    if (!el) return

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    })
  }

  const maskImage = useMemo(
    () => getMaskImage(canScrollUp, canScrollDown),
    [canScrollUp, canScrollDown]
  )

  return (
    <div className={cn("relative flex min-h-0 min-w-0 flex-col", containerClassName)}>
      <button
        type="button"
        onClick={scrollUp}
        aria-label="Desplazar arriba"
        tabIndex={-1}
        style={{ top: arrowTopOffset }}
        className={cn(
          "absolute z-20",
          ARROW_ALIGN_CLASSNAME[arrowAlign],
          "flex h-6 w-8 items-center justify-center rounded-full",
          "bg-[#18181b]/80 backdrop-blur-xl text-neutral-200 transition-opacity duration-200",
          canScrollUp ? "opacity-100" : "pointer-events-none opacity-0",
          arrowClassName,
        )}
      >
        <ChevronUp size={14} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={scrollDown}
        aria-label="Desplazar abajo"
        tabIndex={-1}
        style={{ bottom: arrowBottomOffset }}
        className={cn(
          "absolute z-20",
          ARROW_ALIGN_CLASSNAME[arrowAlign],
          "flex h-6 w-8 items-center justify-center rounded-full",
          "bg-[#18181b]/80 backdrop-blur-xl text-neutral-200 transition-opacity duration-200",
          canScrollDown ? "opacity-100" : "pointer-events-none opacity-0",
          arrowClassName,
        )}
      >
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      <div
        ref={containerRef}
        data-vertical-scroll-container
        style={{
          ...style,
          WebkitMaskImage: maskImage,
          maskImage: maskImage,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
        className={cn(
          "hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain",
          className,
        )}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  )
}
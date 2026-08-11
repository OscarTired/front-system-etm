"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

import { cn } from "@/shared/utils/utils"

const FADE_SIZE = 9
/** Margen mínimo para considerar que hay scroll real (evita flechas por 1–2px). */
const SCROLL_EDGE_PX = 8

type Props = {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  style?: React.CSSProperties
  /**
   * Offset de la flecha superior respecto al borde del **slot de contenido**
   * (el wrapper de VerticalScroll), no del viewport completo.
   * Si el shell ya aplica pt del top bar, usar un valor pequeño (8–12).
   */
  arrowTopOffset?: number
  /**
   * Igual para la flecha inferior respecto al borde inferior del slot.
   * Si el shell ya aplica pb del bottom nav, usar un valor pequeño (8–12).
   */
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
  arrowTopOffset = 8,
  arrowBottomOffset = 8,
  arrowAlign = "center",
  arrowClassName,
  resetKey,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    if (resetKey === undefined) return
    const el = containerRef.current
    if (!el) return
    el.scrollTop = 0
  }, [resetKey])

  const updateArrows = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const { scrollTop, clientHeight, scrollHeight } = el
    const maxScroll = Math.max(0, scrollHeight - clientHeight)

    // Origen del "hueco" al colapsar / cerrar sidebar:
    // el contenido baja de altura y scrollTop queda más allá del máximo.
    // Clamp aquí (ResizeObserver ya observa el content) — no en el shell.
    if (scrollTop > maxScroll) {
      el.scrollTop = maxScroll
    }

    // Sin overflow real → ambas off
    if (maxScroll <= SCROLL_EDGE_PX) {
      setCanScrollUp(false)
      setCanScrollDown(false)
      return
    }

    const top = el.scrollTop
    setCanScrollUp(top > SCROLL_EDGE_PX)
    setCanScrollDown(top < maxScroll - SCROLL_EDGE_PX)
  }, [])

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      updateArrows()
    })
  }, [updateArrows])

  useEffect(() => {
    const el = containerRef.current
    const contentEl = contentRef.current
    if (!el || !contentEl) return

    updateArrows()

    el.addEventListener("scroll", scheduleUpdate, { passive: true })

    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(el)
    observer.observe(contentEl)

    return () => {
      el.removeEventListener("scroll", scheduleUpdate)
      observer.disconnect()
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [updateArrows, scheduleUpdate])

  function scrollUp() {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: 0, behavior: "smooth" })
  }

  function scrollDown() {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }

  const maskImage = useMemo(
    () => getMaskImage(canScrollUp, canScrollDown),
    [canScrollUp, canScrollDown],
  )

  return (
    <div
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col",
        containerClassName,
      )}
    >
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
          "bg-[#18181b]/80 text-neutral-200 backdrop-blur-xl transition-opacity duration-200",
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
          "bg-[#18181b]/80 text-neutral-200 backdrop-blur-xl transition-opacity duration-200",
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
        <div ref={contentRef} className="min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
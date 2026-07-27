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

// Carrusel de KPIs centralizado — usado tanto por el pipeline de
// Tareas como por el panel expandido de Proyectos.
const SCROLL_SETTLE_DELAY = 300

// Fade propio (no useHorizontalFade compartido): acá el contenedor
// con scroll recién se monta cuando el usuario expande el carrusel
// (arranca colapsado) — useHorizontalFade corre su efecto una sola
// vez al montar KpiCarousel, con el contenedor todavía inexistente,
// y nunca vuelve a engancharse. Calculando el fade acá mismo, en el
// efecto que YA tiene `expanded` en sus dependencias (el mismo que
// maneja las flechas), se re-engancha correctamente en el momento
// exacto en que el contenedor aparece — sin poll, sin hooks nuevos.
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
  // Solo Procesos lo necesita abierto desde el primer render — en
  // Tareas/Proyectos sigue arrancando colapsado (comportamiento
  // sin cambios).
  defaultExpanded?: boolean
}

export function KpiCarousel({ cards, summary, defaultExpanded = false }: Props) {

  const { isMobile } = useResponsive()

  // Colapsado por defecto en ambos layouts: una sola fila
  // full-width con el KPI de resumen + botón "..." para expandir
  // a las cards completas. Colapsar/expandir no toca ni desmonta
  // la lógica de scroll de abajo — esa sigue existiendo tal cual,
  // solo se oculta.
  const [expanded, setExpanded] = useState(defaultExpanded)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const [leftFade, setLeftFade] = useState(0)
  const [rightFade, setRightFade] = useState(0)

  // true SOLO mientras hay movimiento activo del carrusel — las
  // flechas se muestran únicamente en esta ventana, para no tapar
  // el contenido mientras el usuario simplemente lo está leyendo.
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

    // Sin sentido observar un contenedor que no existe todavía
    // (desktop, o mobile mientras está colapsado sin carrusel
    // montado). Al depender de `expanded`, este efecto se vuelve a
    // ejecutar exactamente cuando el contenedor aparece en el DOM.
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

  // ---------- Estado colapsado (default): fila única full-width ----------
  if (!expanded) {

    const textColor = getBadgeColors(summary.color, "subtle").text

    const Icon = summary.icon

    return (

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

    )

  }

  // ---------- Estado expandido ----------
  const collapseButton = (

    <div className="mb-2 flex justify-end">

      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-white/10 hover:text-neutral-200"
      >

        <ChevronUp size={14} strokeWidth={2.4} />

        Ocultar indicadores

      </button>

    </div>

  )

  if (!isMobile) {

    return (

      <div>

        {collapseButton}

        <div className="grid grid-cols-2 gap-4 laptop:grid-cols-4">

          {cards}

        </div>

      </div>

    )

  }

  const showLeftArrow = isScrolling && canScrollLeft
  const showRightArrow = isScrolling && canScrollRight

  return (

    <div>

      {collapseButton}

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

    </div>

  )

}
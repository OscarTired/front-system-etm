"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { cn } from "@/shared/utils/utils"

import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { useHorizontalFade } from "@/shared/hooks/use-horizontal-fade"
import { useSnapCarouselSync } from "@/shared/hooks/use-snap-carousel-sync"

import { PIPELINE_PROCESS_ORDER } from "../../utils/process-columns"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"

type Props = {
  value: ProcessCode
  onChange: (code: ProcessCode) => void
  columns: Map<ProcessCode, Task[]>
  // Opcional: si el padre (TaskPipelineBoard) necesita acceso directo
  // al nodo scrolleable (ej. para espejar scroll en tiempo real con
  // el carrusel de tareas de abajo), le pasa su propio ref acá.
  // useDragScroll ya necesita SU PROPIO ref para el drag — este se
  // mergea a mano en el callback ref de más abajo, así los dos
  // apuntan al mismo nodo sin pisarse.
  containerRef?: RefObject<HTMLDivElement | null>
}

// Mismo lenguaje visual que el carrusel de KPIs: un ítem a pantalla
// completa por vez, con snap y flechas — antes eran pills chicas
// mostrando varias a la vez, difícil de leer y de tocar con precisión.
export function PipelineProcessSelector({
  value,
  onChange,
  columns,
  containerRef: externalContainerRef,
}: Props) {
  // Re-render chips when theme toggles (getBadgeColors reads DOM class)
  useThemeStore(s => s.resolved)


  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  const setNodeRefs = useCallback((node: HTMLDivElement | null) => {

    containerRef.current = node

    if (externalContainerRef) {
      externalContainerRef.current = node
    }

  }, [containerRef, externalContainerRef])

  const { leftFade, rightFade } = useHorizontalFade({ containerRef })

  // Sincronización con "value" (swipe acá -> avisa afuera; cambio
  // externo, ej. flecha del pipeline board -> se desliza solo) —
  // compartida con TaskPipelineCarousel, antes copiada acá aparte.
  // Le pasamos el MISMO containerRef que ya usa useDragScroll, para
  // que ambos operen sobre el mismo nodo en vez de crear uno propio
  // sin uso.
  const { scrollToPrevious, scrollToNext } = useSnapCarouselSync({
    value,
    onChange,
    order: PIPELINE_PROCESS_ORDER,
    containerRef,
  })

  const updateArrows = useCallback(() => {

    const el = containerRef.current

    if (!el) {
      return
    }

    setCanScrollLeft(el.scrollLeft > 4)

    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    )

  }, [containerRef])

  useEffect(() => {

    const el = containerRef.current

    if (!el) {
      return
    }

    updateArrows()

    el.addEventListener("scroll", updateArrows, { passive: true })

    const observer = new ResizeObserver(updateArrows)

    observer.observe(el)

    return () => {

      el.removeEventListener("scroll", updateArrows)
      observer.disconnect()

    }

  }, [updateArrows, containerRef])

  return (

    <div className="relative h-12 w-full">

      <button
        type="button"
        onClick={scrollToPrevious}
        aria-label="Proceso anterior"
        tabIndex={-1}
        className={cn(
          "absolute left-1 top-1/2 z-20 -translate-y-1/2",
          "flex h-8 w-8 items-center justify-center rounded-full",
          "bg-card/90 border border-border backdrop-blur-xl text-foreground transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Proceso siguiente"
        tabIndex={-1}
        className={cn(
          "absolute right-1 top-1/2 z-20 -translate-y-1/2",
          "flex h-8 w-8 items-center justify-center rounded-full",
          "bg-card/90 border border-border backdrop-blur-xl text-foreground transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
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
          ref={setNodeRefs}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onClickCapture={handleClickCapture}
          className="hide-scrollbar flex h-full snap-x snap-mandatory items-center overflow-x-auto overflow-y-hidden overscroll-contain scroll-smooth cursor-grab select-none active:cursor-grabbing"
        >

          {PIPELINE_PROCESS_ORDER.map(code => {

            const definition = PROCESS_DEFINITIONS[code]
            const Icon = ENTITY_ICONS[definition.icon]
            const badge = getBadgeColors(definition.color, "subtle")
            const count = columns.get(code)?.length ?? 0
            const isActive = code === value

            return (

              <button
                key={code}
                type="button"
                onClick={() => onChange(code)}
                className={cn(
                  "flex h-10 w-full shrink-0 snap-center items-center justify-center gap-2 rounded-xl border px-3 transition",
                  isActive
                    ? "border-transparent bg-foreground/5"
                    : "border-transparent opacity-50",
                )}
              >

                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ color: badge.text, backgroundColor: badge.background }}
                >
                  {code}
                </span>

                {Icon && (
                  <Icon size={15} className="shrink-0" style={{ color: definition.color }} />
                )}

                <span className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                  {definition.label}
                </span>

                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {count}
                </span>

              </button>

            )

          })}

        </div>

      </div>

    </div>

  )

}
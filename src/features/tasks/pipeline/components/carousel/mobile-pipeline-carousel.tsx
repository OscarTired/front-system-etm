"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { cn } from "@/shared/utils/utils"

import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"

import { PIPELINE_PROCESS_ORDER } from "../../utils/process-columns"
import { TaskProcessColumn } from "../../table/task-process-column"
import { TaskColumnOperator } from "../tasks/task-column-operator"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"

type Props = {
  tasks: Task[]
  columns: Map<ProcessCode, Task[]>
  expandedKey: string | null
  onToggleCard: (key: string) => void
  activeOverlayKey: string | null
  onOverlayOpenChange: (key: string, isOpen: boolean) => void
}

const FADE_MIN = 12
const FADE_MAX = 40

// Mismo mecanismo que la rama desktop de TaskPipelineBoard: un solo
// contenedor con scroll (useDragScroll) — sin hooks de sync propios,
// sin estado de "proceso activo". Header y contenido se mueven
// juntos porque son la misma superficie de scroll.
//
// El header NO reutiliza TaskProcessColumn(headerOnly) — ese es
// ColumnHeader, con "w-72" HARDCODEADO pensado para columnas
// angostas de desktop. Acá se arma un header propio, centrado y a
// todo el ancho, que sí escala con la pantalla. Incluye lo mismo
// que trae ColumnHeader: el chip del proceso Y la fila de operario
// (TaskColumnOperator) — antes se me había quedado afuera.
//
// Las flechas de navegación también son un calco de las de
// desktop (mismo scrollBy), solo que sin el gate de "hoveringHeader"
// —en touch no hay hover— así que se muestran directo según haya o
// no más para scrollear.
export function MobilePipelineCarousel({
  tasks,
  columns,
  expandedKey,
  onToggleCard,
  activeOverlayKey,
  onOverlayOpenChange,
}: Props) {

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  // El fade del borde (mask-image) se escribe DIRECTO al DOM, sin
  // pasar por React state — un intento anterior lo manejaba con
  // isScrolling+setState en cada evento de scroll, y el re-render
  // en pleno gesto interrumpía el scroll nativo por touch (se movía
  // unos pixeles y se trababa). Escribiendo el mask a mano dentro
  // de un rAF, el scroll nunca dispara un render de React — solo
  // mutación de estilo, que el compositor puede aplicar sin
  // interferir con el momentum scroll táctil.
  const maskRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useLayoutEffect(() => {

    const container = containerRef.current
    const mask = maskRef.current

    if (!container || !mask) {
      return
    }

    const applyMask = (leftFade: number, rightFade: number) => {

      const value =
        `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`

      mask.style.maskImage = value
      mask.style.webkitMaskImage = value

    }

    // Antes: dos ResizeObserver + dos listeners de "scroll" separados
    // sobre el MISMO contenedor (uno para el fade-mask, otro para las
    // flechas) — cada uno leyendo scrollLeft/clientWidth/scrollWidth
    // por su cuenta y disparando su propio callback. Un solo update()
    // hace ambas cosas, con un solo rAF compartido: la mitad del
    // trabajo de layout en cada resize/scroll de este carrusel.
    const update = () => {

      const { scrollLeft, clientWidth, scrollWidth } = container

      const maxScroll = Math.max(scrollWidth - clientWidth, 0)

      if (maxScroll <= 0) {
        applyMask(0, 0)
      } else {
        const fadeSize = Math.min(
          Math.max(Math.round(clientWidth * 0.04), FADE_MIN),
          FADE_MAX,
        )

        applyMask(
          Math.min(scrollLeft, fadeSize),
          Math.min(maxScroll - scrollLeft, fadeSize),
        )
      }

      setCanScrollLeft(scrollLeft > 4)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)

    }

    const scheduleUpdate = () => {

      if (rafRef.current !== null) {
        return
      }

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        update()
      })

    }

    mask.style.maskRepeat = "no-repeat"
    mask.style.webkitMaskRepeat = "no-repeat"
    mask.style.maskSize = "100% 100%"
    mask.style.webkitMaskSize = "100% 100%"

    update()

    container.addEventListener("scroll", scheduleUpdate, { passive: true })

    const resizeObserver = new ResizeObserver(scheduleUpdate)

    resizeObserver.observe(container)

    return () => {

      container.removeEventListener("scroll", scheduleUpdate)

      resizeObserver.disconnect()

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

    }

  }, [containerRef])

  function scrollToPrevious() {

    containerRef.current?.scrollBy({
      left: -(containerRef.current?.clientWidth ?? 0),
      behavior: "smooth",
    })

  }

  function scrollToNext() {

    containerRef.current?.scrollBy({
      left: containerRef.current?.clientWidth ?? 0,
      behavior: "smooth",
    })

  }

  return (

    <div className="relative">

      <button
        type="button"
        onClick={scrollToPrevious}
        aria-label="Proceso anterior"
        tabIndex={-1}
        className={cn(
          "absolute left-1 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full",
          "bg-[#18181b]/80 text-foreground backdrop-blur-xl transition-opacity duration-200",
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
          "absolute right-1 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full",
          "bg-[#18181b]/80 text-foreground backdrop-blur-xl transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight size={15} strokeWidth={2.5} />
      </button>

      <div
        ref={maskRef}
        className="overflow-hidden"
      >

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onClickCapture={handleClickCapture}
          className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden select-none"
        >

          {PIPELINE_PROCESS_ORDER.map(code => {

            const definition = PROCESS_DEFINITIONS[code]
            const Icon = ENTITY_ICONS[definition.icon]
            const badge = getBadgeColors(definition.color, "subtle")
            const processTasks = columns.get(code) ?? []
            const count = processTasks.length

            return (

              <div
                key={code}
                className="w-full shrink-0 snap-center"
              >

                {/* Header propio, CENTRADO — igual que el chip
                    del carrusel de KPIs, no left-aligned con el
                    contador empujado a la derecha como en
                    ColumnHeader (desktop). */}
                <div
                  data-drag-scroll-ignore
                  className="flex h-10 items-center justify-center gap-2 border-b px-3"
                  style={{ borderColor: definition.color, cursor: "default" }}
                >

                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                    style={{ color: badge.text, backgroundColor: badge.background }}
                  >
                    {code}
                  </span>

                  {Icon && (
                    <Icon
                      size={15}
                      className="shrink-0"
                      style={{ color: definition.color }}
                    />
                  )}

                  <span className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                    {definition.label}
                  </span>

                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {count}
                  </span>

                </div>

                {/* Fila de operario — lo mismo que trae
                    ColumnHeader en desktop, se había quedado
                    afuera del header propio de acá. */}
                <div
                  data-drag-scroll-ignore
                  className="border-b border-border px-2 py-1"
                  style={{ cursor: "default" }}
                >

                  <TaskColumnOperator
                    processCode={code}
                    tasks={processTasks}
                  />

                </div>

                <div
                  data-drag-scroll-ignore
                  className="mt-2"
                  style={{ cursor: "default" }}
                >

                  <TaskProcessColumn
                    processCode={code}
                    tasks={processTasks}
                    allTasks={tasks}
                    expandedKey={expandedKey}
                    onToggleCard={onToggleCard}
                    activeOverlayKey={activeOverlayKey}
                    onOverlayOpenChange={onOverlayOpenChange}
                    contentOnly
                  />

                </div>

              </div>

            )

          })}

        </div>

      </div>

    </div>

  )

}
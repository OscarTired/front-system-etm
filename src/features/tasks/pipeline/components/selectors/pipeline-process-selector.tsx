"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSnapCarouselSync } from "@/shared/hooks/use-snap-carousel-sync"
import { cn } from "@/shared/utils/utils"
import { PIPELINE_PROCESS_ORDER } from "../../utils/process-columns"
import type { ProcessCode, Task } from "@/features/tasks/types/task.types"

type Props = {
  value: ProcessCode
  onChange: (code: ProcessCode) => void
  columns: Map<ProcessCode, Task[]>
  containerRef?: RefObject<HTMLDivElement | null>
}

export function PipelineProcessSelector({
  value,
  onChange,
  columns,
  containerRef: externalContainerRef,
}: Props) {
  const theme = useThemeStore(s => s.resolved)
  const internalRef = useRef<HTMLDivElement | null>(null)
  const containerRef = externalContainerRef ?? internalRef
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const { scrollToPrevious, scrollToNext } = useSnapCarouselSync({
    value,
    onChange,
    order: PIPELINE_PROCESS_ORDER,
    containerRef,
  })

  const updateArrows = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    updateArrows()
    el.addEventListener("scroll", updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateArrows)
      ro.disconnect()
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
          "absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition",
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Proceso siguiente"
        tabIndex={-1}
        className={cn(
          "absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight size={18} />
      </button>
      <ScrollArea
        ref={containerRef}
        orientation="horizontal"
        dragToScroll
        className="h-full w-full snap-x snap-mandatory"
      >
        <div className="flex h-full w-max">
          {PIPELINE_PROCESS_ORDER.map(code => {
            const definition = PROCESS_DEFINITIONS[code]
            const Icon = ENTITY_ICONS[definition.icon]
            const badge = getBadgeColors(definition.color, "subtle", theme)
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
      </ScrollArea>
    </div>
  )
}

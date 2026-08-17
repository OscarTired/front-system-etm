"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { ProcessBoardNavButton } from "@/shared/ui/process-board"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { ScrollArea } from "@/components/ui/scroll-area"
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

export function MobilePipelineCarousel({
  tasks,
  columns,
  expandedKey,
  onToggleCard,
  activeOverlayKey,
  onOverlayOpenChange,
}: Props) {
  const theme = useThemeStore(s => s.resolved)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useLayoutEffect(() => {
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
  }, [updateArrows, columns])

  function scrollByPage(dir: -1 | 1) {
    const el = containerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: "auto" })
  }

  return (
    <div className="relative w-full">
      <ProcessBoardNavButton
        direction="left"
        visible={canScrollLeft}
        onClick={() => scrollByPage(-1)}
        label="Proceso anterior"
      />
      <ProcessBoardNavButton
        direction="right"
        visible={canScrollRight}
        onClick={() => scrollByPage(1)}
        label="Proceso siguiente"
      />
      <ScrollArea
        ref={containerRef}
        orientation="horizontal"
        dragToScroll
        className="w-full snap-x snap-mandatory"
      >
        <div className="flex w-max">
          {PIPELINE_PROCESS_ORDER.map(code => {
            const definition = PROCESS_DEFINITIONS[code]
            const Icon = ENTITY_ICONS[definition.icon]
            const badge = getBadgeColors(definition.color, "subtle", theme)
            const columnTasks = columns.get(code) ?? []
            return (
              <section
                key={code}
                className="flex w-[min(100vw,28rem)] shrink-0 snap-center flex-col gap-2 px-2"
              >
                <div className="flex items-center justify-center gap-2 px-1">
                  <span
                    className="flex size-7 items-center justify-center rounded-md text-xs font-bold"
                    style={{ color: badge.text, backgroundColor: badge.background }}
                  >
                    {code}
                  </span>
                  {Icon && <Icon size={16} style={{ color: definition.color }} />}
                  <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {definition.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                </div>
                <TaskColumnOperator processCode={code} tasks={tasks} />
                <TaskProcessColumn
                  processCode={code}
                  tasks={columnTasks}
                  allTasks={tasks}
                  expandedKey={expandedKey}
                  onToggleCard={onToggleCard}
                  activeOverlayKey={activeOverlayKey}
                  onOverlayOpenChange={onOverlayOpenChange}
                  contentOnly
                  fullWidth
                />
              </section>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

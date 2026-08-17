"use client"

import type { RefObject } from "react"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"

import { useSnapCarouselSync } from "@/shared/hooks/use-snap-carousel-sync"

import { PIPELINE_PROCESS_ORDER } from "../../utils/process-columns"
import { TaskProcessColumn } from "../../table/task-process-column"

type Props = {
  value: ProcessCode
  onChange: (code: ProcessCode) => void
  tasks: Task[]
  columns: Map<ProcessCode, Task[]>
  expandedKey: string | null
  onToggleCard: (key: string) => void
  activeOverlayKey: string | null
  onOverlayOpenChange: (key: string, isOpen: boolean) => void
  containerRef?: RefObject<HTMLDivElement | null>
}

export function TaskPipelineCarousel({
  value,
  onChange,
  tasks,
  columns,
  expandedKey,
  onToggleCard,
  activeOverlayKey,
  onOverlayOpenChange,
  containerRef: externalContainerRef,
}: Props) {

  const { containerRef } = useSnapCarouselSync({
    value,
    onChange,
    order: PIPELINE_PROCESS_ORDER,
    containerRef: externalContainerRef,
  })

  return (

    <div
      ref={containerRef}
      className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    >

      {PIPELINE_PROCESS_ORDER.map(code => (

        <div
          key={code}
          className="w-full shrink-0 snap-center"
        >

          <TaskProcessColumn
            processCode={code}
            tasks={columns.get(code) ?? []}
            allTasks={tasks}
            expandedKey={expandedKey}
            onToggleCard={onToggleCard}
            activeOverlayKey={activeOverlayKey}
            onOverlayOpenChange={onOverlayOpenChange}
            contentOnly
          />

        </div>

      ))}

    </div>

  )

}
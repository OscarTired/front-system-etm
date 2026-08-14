"use client"

import { Layers3 } from "lucide-react"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"

type Props = {
  processCode: ProcessCode
  tasks: Task[]
}

/** Empty column state — mismos tokens de chip que DynamicBadge / EntityChip. */
export function TaskPipelinePlaceholder({ processCode, tasks }: Props) {
  const process = PROCESS_DEFINITIONS[processCode]
  const badge = useBadgeColors(process.color, "subtle")

  const pieces = tasks.reduce((sum, task) => sum + task.pieces, 0)

  return (
    <div className="flex h-16 items-center justify-between rounded-xl bg-foreground/5 px-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: badge.background, color: badge.text }}
        >
          <Layers3 size={16} />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {process.label}
          </span>
          <span className="text-xs text-muted-foreground">
            Sin tareas en esta etapa
          </span>
        </div>
      </div>

      <span className="text-xs font-medium text-muted-foreground">
        {pieces} pzas
      </span>
    </div>
  )
}

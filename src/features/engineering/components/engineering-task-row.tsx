"use client"

import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { cn } from "@/shared/utils/utils"
import type { EngineeringTask } from "../types/engineering-task.types"

const STATUS_LABEL: Record<EngineeringTask["status"], string> = {
  QUEUE: "En cola",
  PENDING: "Pendiente",
  PROGRESS: "Proceso",
  COMPLETED: "Completado",
}

const STATUS_COLOR: Record<EngineeringTask["status"], string> = {
  QUEUE: "#64748B",
  PENDING: "#2563EB",
  PROGRESS: "#F59E0B",
  COMPLETED: "#16A34A",
}

type Props = {
  task: EngineeringTask
}

export function EngineeringTaskRow({ task }: Props) {
  const projectLabel = task.project
    ? `${task.project.projectCode}`
    : ""

  return (
    <div
      className={cn(
        "flex h-12 min-w-0 w-full items-center gap-2.5 rounded-xl bg-foreground/5 px-3 transition",
        "hover:bg-foreground/10",
      )}
    >
      <span className="w-7 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
        {String(task.taskNumber).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-foreground">
          {task.title}
        </p>
        {projectLabel && (
          <p className="truncate text-[11px] text-muted-foreground">
            {projectLabel}
            {task.assignee ? ` · ${task.assignee.name}` : ""}
          </p>
        )}
      </div>
      <EntityChip
        label={STATUS_LABEL[task.status]}
        color={STATUS_COLOR[task.status]}
      />
    </div>
  )
}

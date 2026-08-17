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
  onClick?: () => void
}

export function EngineeringTaskRow({ task, onClick }: Props) {
  const projectLabel = task.project ? task.project.projectCode : ""

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 min-w-0 w-full items-center gap-2.5 rounded-xl bg-foreground/5 px-3 text-left transition",
        "hover:bg-foreground/10 active:scale-[0.99]",
      )}
    >
      <span className="w-7 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
        {String(task.taskNumber).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-foreground">
          {task.title}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {[projectLabel, task.assignee?.name].filter(Boolean).join(" · ") ||
            "Sin asignar"}
        </p>
      </div>
      <EntityChip
        label={STATUS_LABEL[task.status]}
        color={STATUS_COLOR[task.status]}
      />
    </button>
  )
}

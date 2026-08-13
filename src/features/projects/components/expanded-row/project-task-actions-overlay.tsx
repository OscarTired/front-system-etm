"use client"

import {
  X,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import {
  TaskRowActions,
} from "@/features/tasks/components/actions/task-row-actions"

type Props = {
  task: Task
  visible: boolean
  onClose: () => void
}

export function ProjectTaskActionsOverlay({
  task,
  visible,
  onClose,
}: Props) {
  return (
    <div
      onMouseDown={event =>
        event.stopPropagation()
      }
      onClick={event =>
        event.stopPropagation()
      }
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#0a0a0a] p-4 transition-opacity duration-150",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar acciones"
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">
          ACCIONES DE TAREA
        </span>

        <div className="-ml-3">
          <TaskRowActions task={task} />
        </div>
      </div>
    </div>
  )
}
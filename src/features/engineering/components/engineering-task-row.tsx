"use client"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { WorkflowStatusChip } from "@/features/workflow/components/workflow-status-chip"
import { cn } from "@/shared/utils/utils"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { EngineeringTask, EngineeringTaskStatus } from "../types/engineering-task.types"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { useEngineeringTaskMutations } from "../hooks/use-engineering-task-mutations"

type Props = {
  task: EngineeringTask
  onEdit?: (task: EngineeringTask) => void
}

export function EngineeringTaskRow({ task, onEdit }: Props) {
  const { update, remove } = useEngineeringTaskMutations()
  const isCompleted = task.status === "COMPLETED"

  async function handleComplete() {
    if (isCompleted) return
    await update.mutateAsync({
      id: task.id,
      dto: { status: "COMPLETED" },
    })
  }

  async function handleStatus(status: EngineeringTaskStatus) {
    if (task.status === status) return
    await update.mutateAsync({
      id: task.id,
      dto: { status },
    })
  }

  const STATUS_ITEMS: EngineeringTaskStatus[] = [
    "QUEUE",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
  ]
 
  async function handleDelete() {
    if (isCompleted) return
    await remove.mutateAsync(task.id)
  }

  return (
    <div
      data-drag-scroll-ignore
      className={cn(
        "group flex h-12 min-w-0 w-full items-center gap-2 rounded-xl bg-foreground/5 px-2.5 text-left transition",
        "hover:bg-foreground/10",
      )}
    >
      <button
        type="button"
        onClick={() => onEdit?.(task)}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left active:scale-[0.99]"
      >
        <span className="w-7 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
          {String(task.taskNumber).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium text-foreground">
            {task.title}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            {task.project?.projectCode ? (
              <span
                title={task.project.projectCode}
                className="shrink-0 rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums tracking-wide text-muted-foreground"
              >
                {displayProjectCode(task.project.projectCode)}
              </span>
            ) : null}
            <span className="min-w-0 truncate text-[11px] text-muted-foreground">
              {task.assignee?.name ?? "Sin asignar"}
            </span>
          </div>
        </div>
        <WorkflowStatusChip status={task.status} compact iconOnly />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition hover:bg-foreground/10 hover:text-foreground hover:opacity-100 data-[state=open]:bg-foreground/10 data-[state=open]:opacity-100"
            aria-label="Acciones de tarea"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => onEdit?.(task)}>
            <Pencil size={14} className="mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {STATUS_ITEMS.map(status => {
            const def = WORKFLOW_STATUS_DEFINITIONS[status]
            const active = task.status === status
            return (
              <DropdownMenuItem
                key={status}
                disabled={active}
                onSelect={() => {
                  void handleStatus(status)
                }}
              >
                <span
                  className="mr-2 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: def.color }}
                />
                {def.label}
                {active && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    actual
                  </span>
                )}
              </DropdownMenuItem>
            )
          })}
          {!isCompleted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  void handleDelete()
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

"use client"

import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { WorkflowStatusChip } from "@/features/workflow/components/workflow-status-chip"
import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { ProjectCodeChip } from "@/features/projects/components/project-code-chip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  EngineeringTask,
  EngineeringTaskStatus,
} from "../types/engineering-task.types"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { useEngineeringTaskMutations } from "../hooks/use-engineering-task-mutations"

type Props = {
  task: EngineeringTask
  onEdit?: (task: EngineeringTask) => void
}

export function EngineeringTaskRow({ task, onEdit }: Props) {
  const { isMobile } = useResponsive()
  const hasNote = Boolean(task.note?.trim())
  const { update, remove } = useEngineeringTaskMutations()
  const isCompleted = task.status === "COMPLETED"

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

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 opacity-70 transition-colors hover:bg-background hover:text-foreground hover:opacity-100 data-[state=open]:bg-background data-[state=open]:opacity-100"
          aria-label="Acciones de tarea"
        >
          <MoreHorizontal size={15} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
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
  )

  return (
    <div
      data-drag-scroll-ignore
      className={cn(
        "group flex h-11 min-w-0 w-full items-center gap-2 rounded-xl border-0 bg-card/60 px-2.5 text-left",
        "transition-colors duration-150",
        "hover:border-border/80 hover:bg-accent/80 dark:hover:bg-foreground/[0.08]",
      )}
    >
      {/* 1. Menú de 3 puntos (...) */}
      {menu}

      {/* ÁREA INTERACTIVA COMPLETA DE LA FILA */}
      <button
        type="button"
        onClick={() => onEdit?.(task)}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left focus:outline-none"
      >
        {/* LADO IZQUIERDO: Chip código → Título → • → Asignado */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Chip de código de proyecto */}
          {task.project?.projectCode ? (
            <ProjectCodeChip
              code={task.project.projectCode}
              color={task.project.client?.color}
            />
          ) : null}

          {/* Título de la tarea */}
          <p className="min-w-0 truncate text-xs font-medium text-foreground/80 transition-colors group-hover:text-foreground">
            {task.title}
          </p>

          {/* Separador */}
          <span className="shrink-0 text-[10px] text-muted-foreground/30">•</span>

          {/* Asignado / Sin asignar */}
          <span className="shrink-0 truncate text-xs text-muted-foreground/80 transition-colors group-hover:text-muted-foreground">
            {task.assignee?.name ?? "Sin asignar"}
          </span>
        </div>

        {/* LADO DERECHO: Ícono de nota/detalle → Estado */}
        <div className="flex shrink-0 items-center gap-2">
          {hasNote && (
            <span
              title="Tiene detalle"
              aria-label="Tiene detalle"
              className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400"
            >
              <FileText size={12} strokeWidth={2.25} />
            </span>
          )}

          <WorkflowStatusChip
            status={task.status}
            compact
            iconOnly={isMobile}
          />
        </div>
      </button>
    </div>
  )
}
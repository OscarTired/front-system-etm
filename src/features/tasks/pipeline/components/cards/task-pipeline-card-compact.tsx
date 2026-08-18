"use client"

import { MessageSquare } from "lucide-react"

import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { useThemeStore } from "@/shared/theme"
import { cn } from "@/shared/utils/utils"
import { displayProjectCode } from "@/features/projects/utils/display-project-code"

import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"

import type { ProcessTask } from "@/features/processes/types/process.types"

type Props = {
  processTask: ProcessTask
  // El pipeline (TaskPipelineCard) y Production Hub no tienen
  // ningún botón encima de la card — el badge de estado debe llegar
  // flush hasta el borde derecho (pr-3, igual que pl-3). Solo
  // ProjectTaskRow superpone un botón de chevron "absolute" sobre
  // la card, y ES el único consumidor que necesita este espacio
  // reservado para que el badge no quede tapado por ese botón.
  reserveActionsSpace?: boolean
}

/**
 * Compact kanban row.
 * Status chip vía EntityChip + useBadgeColors (mismo path que
 * KanbanCardView) — reacciona a theme y a cambio de status/color
 * sin quedar “pegado” a un estilo de edición inline.
 */
export function TaskPipelineCardCompact({
  processTask,
  reserveActionsSpace = false,
}: Props) {
  // Suscripción explícita: si solo cambia el resolved del theme,
  // EntityChip ya se re-renderiza vía useBadgeColors; esto cubre
  // cualquier otro consumidor de tokens en este row.
  const themeResolved = useThemeStore(s => s.resolved)

  const task = processTask.task

  // Status por step (QUEUE si aún no le toca).
  const stepStatus =
    processTask.workflowStep?.status ?? "QUEUE"

  const status = WORKFLOW_STATUS_DEFINITIONS[stepStatus]

  const commentCount =
    processTask.workflowStep?.commentCount ??
    processTask.task.commentCount ??
    0

  return (
    <div
      className={cn(
        "flex h-12 min-w-0 w-full items-center gap-2.5 rounded-xl bg-foreground/5 pl-3 transition hover:bg-foreground/10",
        reserveActionsSpace ? "pr-12" : "pr-3",
      )}
    >
      {/* Mismo chip que task-mobile-card / project-mobile-card */}
      <span
        title={task.project.projectCode}
        className="shrink-0 select-none rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide md:px-2 md:py-1 md:text-[11px]"
        style={{
          backgroundColor: `${task.project.client.color}15`,
          color: task.project.client.color,
        }}
      >
        {displayProjectCode(task.project.projectCode)}
      </span>

      <span
        title={task.reference}
        className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground"
      >
        {task.reference}
      </span>

      {commentCount > 0 && (
        <span
          title={
            commentCount === 1
              ? "1 mensaje"
              : `${commentCount} mensajes`
          }
          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-sky-700 dark:text-sky-300"
        >
          <MessageSquare size={10} strokeWidth={2.5} />
          {commentCount}
        </span>
      )}

      {/*
        key fuerza recompute visual si cambia status o theme.
        compact=true: misma altura que el row (h-12).
      */}
      <EntityChip
        key={`${stepStatus}-${status.color}-${themeResolved}`}
        label={status.label}
        color={status.color}
        icon={status.icon}
        compact
        iconOnly
        variant="solid"
      />
    </div>
  )
}

"use client"

import { MessageSquare } from "lucide-react"

import { getBadgeColors } from "@/shared/utils/badge-colors"

import { cn } from "@/shared/utils/utils"

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

export function TaskPipelineCardCompact({
  processTask,
  reserveActionsSpace = false,
}: Props) {

  const task = processTask.task

  // El status ya viene correcto por step (incluyendo "QUEUE"
  // cuando esta etapa todavía no le llegó el turno a la tarea).
  const stepStatus =
    processTask.workflowStep?.status ?? "QUEUE"

  const status =
    WORKFLOW_STATUS_DEFINITIONS[stepStatus]

  const badge =
    getBadgeColors(status.color, "subtle")

  return (

    <div
      className={cn(
        "flex h-12 min-w-0 w-full items-center gap-2.5 rounded-xl bg-white/6 pl-3 transition hover:bg-white/10",
        reserveActionsSpace ? "pr-12" : "pr-3",
      )}
    >

      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: task.priority.color,
        }}
      />

      <span
        title={task.reference}
        className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-300"
      >

        {task.reference}

      </span>

      {(() => {
        const n = processTask.workflowStep?.commentCount
          ?? processTask.task.commentCount
          ?? 0
        return (
          <span
            title={n === 1 ? "1 mensaje" : `${n} mensajes`}
            className={cn(
              "inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
              n > 0
                ? "bg-sky-500/15 text-sky-300"
                : "bg-white/5 text-neutral-600",
            )}
          >
            <MessageSquare size={10} strokeWidth={2.5} />
            {n > 0 ? n : null}
          </span>
        )
      })()}

      <span
        className="flex h-5 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-semibold leading-none"
        style={{
          color: badge.text,
          backgroundColor: badge.background,
        }}
      >

        {status.label}

      </span>

    </div>

  )

}
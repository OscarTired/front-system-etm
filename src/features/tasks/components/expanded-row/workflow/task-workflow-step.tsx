"use client"

import type {
  WorkflowStatus,
} from "@/features/workflow/types/workflow.types"

import {
  cn,
} from "@/shared/utils/utils"

type Props = {

  label: string

  status: WorkflowStatus

}

const statusStyles: Record<
  WorkflowStatus,
  {
    dot: string
    text: string
  }
> = {

  QUEUE: {
    dot: "border-neutral-700 bg-popover",
    text: "text-muted-foreground/80",
  },

  PENDING: {
    dot: "border-neutral-600 bg-neutral-800",
    text: "text-muted-foreground",
  },

  PROGRESS: {
    dot: "border-cyan-400 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]",
    text: "text-foreground",
  },

  PAUSED: {
    dot: "border-amber-400 bg-amber-400",
    text: "text-amber-300",
  },

  COMPLETED: {
    dot: "border-emerald-400 bg-emerald-400",
    text: "text-muted-foreground",
  },

  REVIEWED: {
    dot: "border-emerald-500 bg-emerald-500",
    text: "text-muted-foreground",
  },

}

export function TaskWorkflowStep({
  label,
  status,
}: Props) {

  const style =
    statusStyles[status]

  return (

    <div className="flex flex-col items-center">

      <div
        className={cn(
          "relative flex h-5 w-5 items-center justify-center rounded-full border transition-all",
          style.dot
        )}
      />

      <span
        className={cn(
          "mt-3 text-xs font-semibold tracking-[0.14em]",
          style.text
        )}
      >

        {label}

      </span>

    </div>

  )

}
"use client"

import type {
  WorkflowStep,
} from "@/features/workflow/types/workflow.types"

import {
  createWorkflowView,
} from "@/features/workflow/view/create-workflow-view"

type Props = {

  workflow: WorkflowStep[]

}

export function TaskProgressCard({
  workflow,
}: Props) {

  const workflowView =
    createWorkflowView(
      workflow
    )

  return (

    <div className="rounded-2xl border border-border bg-card p-5">

      <div className="mb-4 text-xs font-semibold tracking-[0.16em] text-muted-foreground">

        PROGRESO

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-foreground/5">

        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{
            width: `${workflowView.progress}%`,
          }}
        />

      </div>

      <div className="mt-4 flex items-center justify-between">

        <span className="text-2xl font-bold text-foreground">

          {workflowView.progress}%

        </span>

        <span className="text-sm text-muted-foreground">

          {workflowView.completedSteps}
          {" / "}
          {workflowView.totalSteps}
          {" procesos"}

        </span>

      </div>

    </div>

  )

}
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

export function TaskWorkflowSummaryCard({
  workflow,
}: Props) {

  const workflowView =
    createWorkflowView(
      workflow
    )

  return (

    <div className="rounded-2xl border border-border bg-card p-6">

      <div className="mb-6 text-xs font-semibold tracking-[0.18em] text-muted-foreground">

        PROCESO ACTUAL

      </div>

      <div className="text-3xl font-bold text-foreground">

        {

          workflowView.completed

            ? "COMPLETADO"

            : workflowView.currentProcess ?? "-"

        }

      </div>

      <div className="mt-2 text-sm font-medium text-muted-foreground">

        {

          workflowView.completed

            ? "Workflow finalizado"

            : workflowView.currentStatus ?? "-"

        }

      </div>

      <div className="mt-8">

        <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground">

          AVANCE

        </div>

        <div className="text-4xl font-bold text-foreground">

          {workflowView.progress}%

        </div>

        <div className="mt-2 text-sm text-muted-foreground">

          {workflowView.completedSteps}
          {" / "}
          {workflowView.totalSteps}
          {" procesos completados"}

        </div>

      </div>

    </div>

  )

}
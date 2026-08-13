"use client"

import type {
  WorkflowStep,
} from "@/features/workflow/types/workflow.types"

import {
  TaskWorkflowTimeline,
} from "./task-workflow-timeline"

import {
  TaskProgressCard,
} from "./task-progress-card"

import {
  TaskWorkflowSummaryCard,
} from "./task-workflow-summary-card"

type Props = {

  workflow: WorkflowStep[]

}

export function TaskWorkflowSection({
  workflow,
}: Props) {

  return (

    <div className="rounded-2xl border border-border bg-card p-6">

      <div className="mb-6 text-xs font-semibold tracking-[0.18em] text-muted-foreground">

        WORKFLOW

      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

        <div>

          <TaskWorkflowTimeline
            workflow={workflow}
          />

        </div>

        <TaskWorkflowSummaryCard
          workflow={workflow}
        />

      </div>

      <div className="mt-6">

        <TaskProgressCard
          workflow={workflow}
        />

      </div>

    </div>

  )

}
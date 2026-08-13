"use client"

import type {
  WorkflowStep,
} from "@/features/workflow/types/workflow.types"

import {
  cn,
} from "@/shared/utils/utils"

import {
  TaskWorkflowStep,
} from "./task-workflow-step"

type Props = {

  workflow: WorkflowStep[]

}

export function TaskWorkflowTimeline({
  workflow,
}: Props) {

  return (

    <div className="flex items-start">

      {workflow.map(
        (
          step,
          index
        ) => {

          const isLast =

            index ===
            workflow.length - 1

          const connectorActive =

            step.status === "COMPLETED" ||
            step.status === "REVIEWED"

          return (

            <div
              key={step.id}
              className="flex flex-1 items-center"
            >

              <TaskWorkflowStep
                label={step.processCode}
                status={step.status}
              />

              {!isLast && (

                <div
                  className={cn(
                    "mx-4 mt-5.5 h-px flex-1",
                    connectorActive
                      ? "bg-emerald-500/60"
                      : "bg-foreground/10"
                  )}
                />

              )}

            </div>

          )

        }
      )}

    </div>

  )

}
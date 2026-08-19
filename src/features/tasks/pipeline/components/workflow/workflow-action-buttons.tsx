"use client"

import { useState } from "react"

import { WorkflowAction } from "@/shared/ui/actions/workflow-action"

import { useWorkflowStepActions } from "@/features/processes/hooks/use-workflow-step-actions"

import type { ProcessTask } from "@/features/processes/types/process.types"
import type { WorkflowFormVariant } from "@/features/tasks/pipeline/hooks/use-task-workflow-form"

type BaseProps = {
  processTask: ProcessTask
  onClose: () => void
}

type SelectorProps = BaseProps & {
  variant?: undefined
  onStart: () => void
  onComplete: () => void
}

type ConfirmProps = BaseProps & {
  variant: WorkflowFormVariant
  onBack: () => void
  blocked?: boolean
}

type Props = SelectorProps | ConfirmProps

type ActionKey =
  | "start"
  | "pause"
  | "resume"
  | "complete"
  | "review"

function isConfirmProps(props: Props): props is ConfirmProps {
  return props.variant !== undefined
}

export function WorkflowActionButtons(props: Props) {

  const { processTask, onClose } = props

  const workflowStep = processTask.workflowStep

  const task = processTask.task

  const [pendingAction, setPendingAction] =
    useState<ActionKey | null>(null)

  const {
    canUpdate,
    canReview,
    handleStart,
    handlePause,
    handleResume,
    handleComplete,
    handleReview,
  } = useWorkflowStepActions({
    task,
    stepId: workflowStep?.id ?? "",
    processCode: workflowStep?.processCode ?? "CT",
  })

  if (!workflowStep) {
    return null
  }

  const { status } = workflowStep

  const isSubmitting = pendingAction !== null

  const blocked =
    isConfirmProps(props)
      ? Boolean(props.blocked)
      : false

  async function runAndClose(
    key: ActionKey,
    action: () => Promise<boolean>,
  ) {

    if (isSubmitting || blocked) {
      return
    }

    setPendingAction(key)

    try {

      const ok = await action()

      if (ok) {
        onClose()
      }

    } finally {

      setPendingAction(null)

    }

  }

  // --- Confirmación de formulario (Iniciar / Completar) ---
  if (isConfirmProps(props)) {

    if (props.variant === "start") {

      return (

        <WorkflowAction
          label="Iniciar"
          variant="start"
          fullWidth
          disabled={!canUpdate || isSubmitting || blocked}
          loading={pendingAction === "start"}
          loadingLabel="Iniciando..."
          onClick={() => runAndClose("start", handleStart)}
        />

      )

    }

    return (

      <WorkflowAction
        label="Completar"
        variant="complete"
        fullWidth
        disabled={!canUpdate || isSubmitting || blocked}
        loading={pendingAction === "complete"}
        loadingLabel="Completando..."
        onClick={() => runAndClose("complete", handleComplete)}
      />

    )

  }

  // --- Selector inicial (sin variant) ---

  if (status === "PENDING") {

    return (

      <WorkflowAction
        label="Iniciar"
        variant="start"
        fullWidth
        disabled={!canUpdate}
        onClick={props.onStart}
      />

    )

  }

  if (status === "PROGRESS") {

    // Pausar y Completar, apilados (uno encima del otro), full width
    return (

      <div className="flex flex-col gap-2">

        <WorkflowAction
          label="Pausar"
          variant="pause"
          fullWidth
          disabled={!canUpdate || isSubmitting}
          loading={pendingAction === "pause"}
          loadingLabel="Pausando..."
          onClick={() => runAndClose("pause", handlePause)}
        />

        <WorkflowAction
          label="Completar"
          variant="complete"
          fullWidth
          disabled={!canUpdate || isSubmitting}
          onClick={props.onComplete}
        />

      </div>

    )

  }

  if (status === "PAUSED") {

    return (

      <WorkflowAction
        label="Reanudar"
        variant="start"
        fullWidth
        disabled={!canUpdate || isSubmitting}
        loading={pendingAction === "resume"}
        loadingLabel="Reanudando..."
        onClick={() => runAndClose("resume", handleResume)}
      />

    )

  }

  if (status === "COMPLETED") {

    return (

      <WorkflowAction
        label="Revisar"
        variant="review"
        fullWidth
        disabled={!canReview || isSubmitting}
        loading={pendingAction === "review"}
        loadingLabel="Revisando..."
        onClick={() => runAndClose("review", handleReview)}
      />

    )

  }

  return null

}
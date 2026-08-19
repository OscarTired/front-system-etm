"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { workflowAccess } from "@/features/workflow/access/workflow-access"
import { getWorkflowFormFields } from "../utils/get-workflow-form-fields"
import type { WorkflowNumericFieldKey } from "../components/workflow/workflow-numeric-field"
import type { ProcessTask } from "@/features/processes/types/process.types"
import type { ProcessCode } from "@/features/tasks/types/task.types"

export type WorkflowFormVariant = "start" | "complete"

type Options = {
  processTask: ProcessTask
  processCode: ProcessCode
  visible: boolean
  onClose: () => void
}

export function useTaskWorkflowForm({
  processTask,
  processCode,
  visible,
  onClose,
}: Options) {
  const [variant, setVariant] = useState<WorkflowFormVariant | null>(null)
  const [changeOperator, setChangeOperator] = useState(false)
  const [displayVariant, setDisplayVariant] = useState<WorkflowFormVariant | null>(null)

  const savingFields = useRef(new Set<string>())
  const [anyFieldSaving, setAnyFieldSaving] = useState(false)
  const [savedFields, setSavedFields] = useState(new Set<WorkflowNumericFieldKey>())
  const [operatorSaving, setOperatorSaving] = useState(false)
  const [backCount, setBackCount] = useState(0)

  const locked = workflowAccess.isCompleted(processTask)
  const status = processTask.workflowStep?.status
  const skipsSelector = status === "PENDING"

  // Sincronizar displayVariant al abrir o cambiar variant
  useEffect(() => {
    if (!visible) return
    setDisplayVariant(variant)
  }, [visible, variant])

  // Reset del estado al volverse visible
  useEffect(() => {
    if (!visible) return

    setVariant(null)
    setChangeOperator(false)
    setSavedFields(new Set())
    setAnyFieldSaving(false)
    savingFields.current.clear()
    setBackCount(0)
    setOperatorSaving(false)

    if (skipsSelector) {
      setVariant("start")
    }
  }, [visible, skipsSelector])

  const fields = useMemo(
    () => (displayVariant ? getWorkflowFormFields(processCode, displayVariant) : []),
    [processCode, displayVariant]
  )

  const numericFields = useMemo(
    () => fields.filter((f): f is WorkflowNumericFieldKey => f !== "operator"),
    [fields]
  )

  useEffect(() => {
    if (displayVariant !== "complete" || backCount > 0) return

    const alreadySaved = numericFields.filter((field) => {
      const value = workflowAccess.numericField(processTask, field)
      return value !== null && value !== undefined
    })

    if (alreadySaved.length === 0) return

    setSavedFields((prev) => new Set([...prev, ...alreadySaved]))
  }, [displayVariant, backCount, numericFields, processTask])

  const allFieldsSaved =
    displayVariant === "complete" &&
    numericFields.length > 0 &&
    numericFields.every((f) => savedFields.has(f))

  const showFieldsStep = displayVariant === "complete" && !allFieldsSaved
  const showCompleteStep = displayVariant === "complete" && allFieldsSaved

  const canChangeOperator =
    !displayVariant && (status === "PROGRESS" || status === "PAUSED" || status === "PENDING")

  const showBackButton =
    changeOperator ||
    canChangeOperator ||
    (Boolean(displayVariant) && !(displayVariant === "start" && skipsSelector))

  function handleFieldSavingChange(field: WorkflowNumericFieldKey, saving: boolean) {
    if (saving) {
      savingFields.current.add(field)
    } else {
      savingFields.current.delete(field)
    }
    setAnyFieldSaving(savingFields.current.size > 0)
  }

  function handleFieldSaved(field: WorkflowNumericFieldKey) {
    setSavedFields((prev) => new Set(prev).add(field))
  }

  function handleClose(e?: React.SyntheticEvent) {
    e?.stopPropagation()
    e?.preventDefault()
    setChangeOperator(false)
    onClose()
  }

  function handleBack(e?: React.SyntheticEvent) {
    e?.stopPropagation()
    e?.preventDefault()
    if (changeOperator) {
      setChangeOperator(false)
      return
    }
    if (displayVariant) {
      setVariant(null)
      setSavedFields(new Set())
      setBackCount((c) => c + 1)
      return
    }
    setChangeOperator(true)
  }

  return {
    state: {
      displayVariant,
      changeOperator,
      locked,
      numericFields,
      showFieldsStep,
      showCompleteStep,
      showBackButton,
      operatorSaving,
      anyFieldSaving,
      backCount,
    },
    actions: {
      setVariant,
      setChangeOperator,
      setOperatorSaving,
      handleClose,
      handleBack,
      handleFieldSavingChange,
      handleFieldSaved,
    },
  }
}
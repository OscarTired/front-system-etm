"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, X } from "lucide-react"

import { cn } from "@/shared/utils/utils"

import { workflowAccess } from "@/features/workflow/access/workflow-access"
import { ProcessOperatorCell } from "@/features/processes/components/cells/process-operator-cell"

import { WorkflowActionButtons } from "../workflow/workflow-action-buttons"
import { WorkflowNumericField, type WorkflowNumericFieldKey } from "../workflow/workflow-numeric-field"

import { getWorkflowFormFields } from "../../utils/get-workflow-form-fields"
import type { WorkflowFieldType } from "../../config/workflow-form-fields"

import type { ProcessTask } from "@/features/processes/types/process.types"
import type { ProcessCode } from "@/features/tasks/types/task.types"

export type WorkflowFormVariant = "start" | "complete"

type Props = {
  processTask: ProcessTask
  processCode: ProcessCode
  visible: boolean
  onClose: () => void
  onClosed?: () => void
}

const FIELD_LABELS: Record<WorkflowFieldType, string> = {
  operator: "Operario",
  piecesOutput: "Piezas",
  plRtReal: "PL/RT real",
  paintKgReal: "Pintura (KG)",
}

const FIELD_LABELS_BY_PROCESS: Partial<
  Record<ProcessCode, Partial<Record<WorkflowFieldType, string>>>
> = {
  DS: { piecesOutput: "Piezas" },
}

function getFieldLabel(processCode: ProcessCode, field: WorkflowFieldType) {
  return FIELD_LABELS_BY_PROCESS[processCode]?.[field] ?? FIELD_LABELS[field]
}

export function TaskWorkflowOverlay({
  processTask,
  processCode,
  visible,
  onClose,
  onClosed,
}: Props) {
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

  useEffect(() => {
    if (!visible) return
    setDisplayVariant(variant)
  }, [visible, variant])

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
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const canChangeOperator =
    !displayVariant && (status === "PROGRESS" || status === "PAUSED" || status === "PENDING")

  const showBackButton =
    changeOperator ||
    canChangeOperator ||
    (Boolean(displayVariant) && !(displayVariant === "start" && skipsSelector))

  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      data-drag-scroll-ignore
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerUp={stopPropagation}
      onTouchStart={stopPropagation}
      onTouchEnd={stopPropagation}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === "opacity" &&
          !visible
        ) {
          onClosed?.()
        }
      }}
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden rounded-xl bg-background transition-opacity duration-150",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {showBackButton && (
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-2 top-2 z-10 flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={14} />
          Volver
        </button>
      )}

      {/* Único punto de cierre manual explícito */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar"
        className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X size={14} />
      </button>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 p-4">
        {showFieldsStep &&
          (numericFields.length === 1 ? (
            <div className="flex justify-center">
              <div className="w-1/2 min-w-40">
                <WorkflowNumericField
                  processTask={processTask}
                  field={numericFields[0]}
                  label={getFieldLabel(processCode, numericFields[0])}
                  disabled={locked}
                  forceEmpty={backCount > 0}
                  onSavingChange={(saving) =>
                    handleFieldSavingChange(numericFields[0], saving)
                  }
                  onSaved={() => handleFieldSaved(numericFields[0])}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {numericFields.map((field) => (
                <WorkflowNumericField
                  key={field}
                  processTask={processTask}
                  field={field}
                  label={getFieldLabel(processCode, field)}
                  disabled={locked}
                  forceEmpty={backCount > 0}
                  onSavingChange={(saving) => handleFieldSavingChange(field, saving)}
                  onSaved={() => handleFieldSaved(field)}
                />
              ))}
            </div>
          ))}

        {displayVariant === "start" && (
          <div className="flex items-center justify-center rounded-lg bg-foreground/5 px-3 py-2">
            <ProcessOperatorCell
              processTask={processTask}
              onSavingChange={setOperatorSaving}
            />
          </div>
        )}

        {changeOperator && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-xs font-medium text-muted-foreground">
              Cambiar operario
            </p>
            <div className="flex items-center justify-center rounded-lg bg-foreground/5 px-3 py-2">
              <ProcessOperatorCell
                processTask={processTask}
                onSavingChange={setOperatorSaving}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setChangeOperator(false)
              }}
              className="h-9 w-full rounded-lg bg-foreground/5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/10"
            >
              Listo
            </button>
          </div>
        )}

        <div className={cn("flex flex-col gap-2", changeOperator && "hidden")}>
          {displayVariant === "start" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 flex-1 rounded-lg bg-foreground/5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/10"
              >
                Cancelar
              </button>
              <div className="flex-1">
                <WorkflowActionButtons
                  processTask={processTask}
                  variant="start"
                  onBack={handleBack}
                  onClose={handleClose}
                  blocked={operatorSaving}
                />
              </div>
            </div>
          )}

          {showCompleteStep && (
            <WorkflowActionButtons
              processTask={processTask}
              variant="complete"
              onBack={handleBack}
              onClose={handleClose}
              blocked={anyFieldSaving}
            />
          )}

          {!displayVariant && (
            <WorkflowActionButtons
              processTask={processTask}
              onStart={() => setVariant("start")}
              onComplete={() => setVariant("complete")}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
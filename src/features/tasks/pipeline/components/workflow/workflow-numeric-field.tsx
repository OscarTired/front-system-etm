"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"

import { cn } from "@/shared/utils/utils"

import { useWorkflowStepField } from "@/features/workflow/hooks/use-workflow-step-field"
import { workflowAccess } from "@/features/workflow/access/workflow-access"

import type { ProcessTask } from "@/features/processes/types/process.types"

export type WorkflowNumericFieldKey =
  | "piecesOutput"
  | "plRtReal"
  | "paintKgReal"

type Props = {
  processTask: ProcessTask
  field: WorkflowNumericFieldKey
  label: string
  disabled?: boolean
  // Fuerza el input a arrancar vacío aunque ya exista un valor
  // guardado en backend. Se usa cuando el usuario apretó "Volver"
  // desde esta misma sesión del overlay, para que el campo pida
  // confirmación de nuevo en vez de mostrar el valor previo.
  forceEmpty?: boolean
  onSavingChange?: (saving: boolean) => void
  onSaved?: () => void
}

export function WorkflowNumericField({
  processTask,
  field,
  label,
  disabled,
  forceEmpty = false,
  onSavingChange,
  onSaved,
}: Props) {

  const updateField = useWorkflowStepField()

  const stepId = workflowAccess.stepId(processTask)

  const savedValue =
    workflowAccess.numericField(processTask, field)

  const [draft, setDraft] = useState(
    forceEmpty || savedValue === null || savedValue === undefined
      ? ""
      : String(savedValue),
  )

  const [saving, setSaving] = useState(false)

  useEffect(() => {

    setDraft(
      forceEmpty || savedValue === null || savedValue === undefined
        ? ""
        : String(savedValue),
    )

  }, [savedValue, forceEmpty])

  const isSaved =
    !forceEmpty &&
    savedValue !== null &&
    savedValue !== undefined &&
    draft.trim() !== "" &&
    draft.trim() === String(savedValue).trim()

  const canSave =
    !disabled &&
    !saving &&
    draft.trim() !== "" &&
    !isSaved

  async function handleSave() {

    if (!stepId || !canSave) {
      return
    }

    const parsed = Number(draft)

    setSaving(true)

    onSavingChange?.(true)

    try {

      await updateField(

        stepId,

        { [field]: parsed },

        { [field]: parsed },

      )

      // Notificamos al overlay que este campo fue guardado
      // exitosamente en esta sesión.
      onSaved?.()

    } finally {

      setSaving(false)

      onSavingChange?.(false)

    }

  }

  return (

    <div className="space-y-1">

      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>

      <div
        className={cn(
          "flex h-11 items-center rounded-xl bg-foreground/5 px-3 transition-opacity",
          saving && "opacity-70",
        )}
      >

        <input
          type="number"
          value={draft}
          disabled={disabled || saving}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {

            if (event.key === "Enter") {
              handleSave()
            }

          }}
          placeholder="0"
          className="w-8 min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/80 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            isSaved
              ? "bg-emerald-500 text-foreground"
              : canSave
                ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-foreground/5 text-muted-foreground/80",
          )}
        >

          {saving
            ? <Spinner size={14} />
            : <Check size={14} />
          }

        </button>

      </div>

    </div>

  )

}
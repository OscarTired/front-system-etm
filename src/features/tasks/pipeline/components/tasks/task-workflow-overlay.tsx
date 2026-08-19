"use client"

import { ChevronLeft, X } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { ProcessOperatorCell } from "@/features/processes/components/cells/process-operator-cell"

import { WorkflowActionButtons } from "../workflow/workflow-action-buttons"
import { WorkflowNumericField } from "../workflow/workflow-numeric-field"

import type { ProcessTask } from "@/features/processes/types/process.types"
import type { ProcessCode } from "@/features/tasks/types/task.types"
import { useTaskWorkflowForm, type WorkflowFormVariant } from "../../hooks/use-task-workflow-form"

type Props = {
  processTask: ProcessTask
  processCode: ProcessCode
  visible: boolean
  onClose: () => void
  onClosed?: () => void
}

const FIELD_LABELS: Record<string, string> = {
  operator: "Operario",
  piecesOutput: "Piezas",
  plRtReal: "PL/RT real",
  paintKgReal: "Pintura (KG)",
}

const FIELD_LABELS_BY_PROCESS: Partial<
  Record<ProcessCode, Record<string, string>>
> = {
  DS: { piecesOutput: "Piezas" },
}

function getFieldLabel(processCode: ProcessCode, field: string) {
  return FIELD_LABELS_BY_PROCESS[processCode]?.[field] ?? FIELD_LABELS[field]
}

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation()

const STOP_PROPAGATION_PROPS = {
  onMouseDown: stopPropagation,
  onMouseUp: stopPropagation,
  onClick: stopPropagation,
  onPointerDown: stopPropagation,
  onPointerUp: stopPropagation,
  onTouchStart: stopPropagation,
  onTouchEnd: stopPropagation,
} as const

export function TaskWorkflowOverlay({
  processTask,
  processCode,
  visible,
  onClose,
  onClosed,
}: Props) {
  const { state, actions } = useTaskWorkflowForm({
    processTask,
    processCode,
    visible,
    onClose,
  })

  return (
    <div
      data-drag-scroll-ignore
      {...STOP_PROPAGATION_PROPS}
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
      {state.showBackButton && (
        <button
          type="button"
          onClick={actions.handleBack}
          className="absolute left-2 top-2 z-10 flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={14} />
          Volver
        </button>
      )}

      <button
        type="button"
        onClick={actions.handleClose}
        aria-label="Cerrar"
        className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X size={14} />
      </button>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 p-4">
        {state.showFieldsStep &&
          (state.numericFields.length === 1 ? (
            <div className="flex justify-center">
              <div className="w-1/2 min-w-40">
                <WorkflowNumericField
                  processTask={processTask}
                  field={state.numericFields[0]}
                  label={getFieldLabel(processCode, state.numericFields[0])}
                  disabled={state.locked}
                  forceEmpty={state.backCount > 0}
                  onSavingChange={(saving) =>
                    actions.handleFieldSavingChange(state.numericFields[0], saving)
                  }
                  onSaved={() => actions.handleFieldSaved(state.numericFields[0])}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {state.numericFields.map((field) => (
                <WorkflowNumericField
                  key={field}
                  processTask={processTask}
                  field={field}
                  label={getFieldLabel(processCode, field)}
                  disabled={state.locked}
                  forceEmpty={state.backCount > 0}
                  onSavingChange={(saving) =>
                    actions.handleFieldSavingChange(field, saving)
                  }
                  onSaved={() => actions.handleFieldSaved(field)}
                />
              ))}
            </div>
          ))}

        {state.displayVariant === "start" && (
          <div className="flex items-center justify-center rounded-lg bg-foreground/5 px-3 py-2">
            <ProcessOperatorCell
              processTask={processTask}
              onSavingChange={actions.setOperatorSaving}
            />
          </div>
        )}

        {state.changeOperator && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-xs font-medium text-muted-foreground">
              Cambiar operario
            </p>
            <div className="flex items-center justify-center rounded-lg bg-foreground/5 px-3 py-2">
              <ProcessOperatorCell
                processTask={processTask}
                onSavingChange={actions.setOperatorSaving}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                actions.setChangeOperator(false)
              }}
              className="h-9 w-full rounded-lg bg-foreground/5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/10"
            >
              Listo
            </button>
          </div>
        )}

        <div className={cn("flex flex-col gap-2", state.changeOperator && "hidden")}>
          {state.displayVariant === "start" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={actions.handleClose}
                className="h-9 flex-1 rounded-lg bg-foreground/5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/10"
              >
                Cancelar
              </button>
              <div className="flex-1">
                <WorkflowActionButtons
                  processTask={processTask}
                  variant="start"
                  onBack={actions.handleBack}
                  onClose={actions.handleClose}
                  blocked={state.operatorSaving}
                />
              </div>
            </div>
          )}

          {state.showCompleteStep && (
            <WorkflowActionButtons
              processTask={processTask}
              variant="complete"
              onBack={actions.handleBack}
              onClose={actions.handleClose}
              blocked={state.anyFieldSaving}
            />
          )}

          {!state.displayVariant && (
            <WorkflowActionButtons
              processTask={processTask}
              onStart={() => actions.setVariant("start")}
              onComplete={() => actions.setVariant("complete")}
              onClose={actions.handleClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
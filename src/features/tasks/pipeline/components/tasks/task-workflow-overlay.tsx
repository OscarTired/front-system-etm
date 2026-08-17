"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, X } from "lucide-react"

import { cn } from "@/shared/utils/utils"

import { workflowAccess } from "@/features/workflow/access/workflow-access"
import { ProcessOperatorCell } from "@/features/processes/components/cells/process-operator-cell"

import { PIPELINE_SCROLL_INTERACTION_EVENT } from "@/shared/ui/scroll/scroll-interaction"

import { WorkflowActionButtons } from "../workflow/workflow-action-buttons"
import { WorkflowNumericField, type WorkflowNumericFieldKey } from "../workflow/workflow-numeric-field"

import { getWorkflowFormFields } from "../../utils/get-workflow-form-fields"
import type { WorkflowFieldType } from "../../config/workflow-form-fields"

import type { ProcessTask } from "@/features/processes/types/process.types"
import type { ProcessCode } from "@/features/tasks/types/task.types"

export type WorkflowFormVariant =
  | "start"
  | "complete"

type Props = {
  processTask: ProcessTask
  processCode: ProcessCode
  visible: boolean
  onClose: () => void
  // Se dispara cuando la transición de fade-out del overlay
  // termina realmente (evento nativo de CSS), no en base a un
  // tiempo asumido. Lo usa el padre para saber cuándo es seguro
  // colapsar el contenido de la card a compacto sin generar saltos.
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

function getFieldLabel(
  processCode: ProcessCode,
  field: WorkflowFieldType,
) {

  return (
    FIELD_LABELS_BY_PROCESS[processCode]?.[field] ??
    FIELD_LABELS[field]
  )

}

export function TaskWorkflowOverlay({
  processTask,
  processCode,
  visible,
  onClose,
  onClosed,
}: Props) {

  const [variant, setVariant] =
    useState<WorkflowFormVariant | null>(null)

  // displayVariant se congela cuando visible pasa a false —
  // el overlay se desvanece mostrando el último estado,
  // sin flash de pantalla anterior.
  const [displayVariant, setDisplayVariant] =
    useState<WorkflowFormVariant | null>(null)

  const savingFields =
    useRef(new Set<string>())

  const [anyFieldSaving, setAnyFieldSaving] =
    useState(false)

  const [savedFields, setSavedFields] =
    useState(new Set<WorkflowNumericFieldKey>())

  // true mientras se está guardando el operario asignado — bloquea
  // "Iniciar" hasta que el backend confirme, evitando la carrera
  // donde tocar Iniciar muy rápido tras elegir operario fallaba
  // porque el step arrancaba sin el operario todavía confirmado.
  const [operatorSaving, setOperatorSaving] =
    useState(false)

  // Se incrementa cada vez que el usuario aprieta "Volver" desde
  // los campos numéricos. Mientras sea > 0, los campos arrancan
  // vacíos (forceEmpty) aunque ya tengan valor guardado en backend,
  // para que el usuario tenga que reconfirmar antes de avanzar.
  const [backCount, setBackCount] =
    useState(0)

  const locked =
    workflowAccess.isCompleted(processTask)

  const status =
    processTask.workflowStep?.status

  const skipsSelector =
    status === "PENDING"

  // variant controla la lógica real.
  // displayVariant solo se actualiza mientras visible es true,
  // así el contenido visual se "congela" al cerrar.
  useEffect(() => {

    if (!visible) {
      return
    }

    setDisplayVariant(variant)

  }, [visible, variant])

  // Al abrir limpio el estado.
  // OJO: no resetear displayVariant acá. El efecto de arriba ya lo
  // sincroniza con variant. Si acá también lo pisamos a null, y
  // variant termina volviendo al mismo valor que tenía antes
  // (ej. "start" -> null -> "start"), React no vuelve a disparar
  // el efecto de displayVariant (su dependencia "variant" no
  // cambió), y displayVariant queda trabado en null para siempre.
  useEffect(() => {

    if (!visible) {
      return
    }

    setVariant(null)
    setSavedFields(new Set())
    setAnyFieldSaving(false)
    savingFields.current.clear()
    setBackCount(0)
    setOperatorSaving(false)

    if (skipsSelector) {
      setVariant("start")
    }

  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {

    if (!visible) {
      return
    }

    function handleScrollInteraction() {
      onClose()
    }

    window.addEventListener(
      PIPELINE_SCROLL_INTERACTION_EVENT,
      handleScrollInteraction,
    )

    return () => {

      window.removeEventListener(
        PIPELINE_SCROLL_INTERACTION_EVENT,
        handleScrollInteraction,
      )

    }

  }, [visible, onClose])

  const fields =
    useMemo(

      () =>

        displayVariant
          ? getWorkflowFormFields(
              processCode,
              displayVariant,
            )
          : [],

      [processCode, displayVariant],

    )

  const numericFields =
    useMemo(

      () =>

        fields.filter(
          (f): f is WorkflowNumericFieldKey => f !== "operator",
        ),

      [fields],

    )

  // Si el paso "complete" ya tenía estos campos guardados de una
  // sesión anterior (ej. se llenaron, se cerró el overlay, se
  // volvió a abrir), WorkflowNumericField los muestra con el check
  // verde de entrada — pero ese botón queda deshabilitado
  // (isSaved=true bloquea canSave), así que nunca dispara onSaved()
  // y savedFields se queda vacío para siempre: el overlay no
  // avanza al paso de completar aunque todo se vea "listo". Acá se
  // sincroniza savedFields con lo que el backend ya tiene apenas se
  // entra al paso "complete" — backCount > 0 es la excepción a
  // propósito: significa que el usuario tocó "Volver" y quiere
  // reconfirmar de verdad, no que se autocompleten los checks de
  // nuevo con el valor viejo.
  useEffect(() => {

    if (displayVariant !== "complete" || backCount > 0) {
      return
    }

    const alreadySaved = numericFields.filter(field => {

      const value = workflowAccess.numericField(processTask, field)

      return value !== null && value !== undefined

    })

    if (alreadySaved.length === 0) {
      return
    }

    setSavedFields(prev => new Set([...prev, ...alreadySaved]))

  }, [displayVariant, backCount, numericFields, processTask])

  const allFieldsSaved =
    displayVariant === "complete" &&
    numericFields.length > 0 &&
    numericFields.every(f => savedFields.has(f))

  const showFieldsStep =
    displayVariant === "complete" && !allFieldsSaved

  const showCompleteStep =
    displayVariant === "complete" && allFieldsSaved

  function handleFieldSavingChange(
    field: WorkflowNumericFieldKey,
    saving: boolean,
  ) {

    if (saving) {
      savingFields.current.add(field)
    } else {
      savingFields.current.delete(field)
    }

    setAnyFieldSaving(savingFields.current.size > 0)

  }

  function handleFieldSaved(
    field: WorkflowNumericFieldKey,
  ) {

    setSavedFields(prev => {

      const next = new Set(prev)

      next.add(field)

      return next

    })

  }

  function handleClose() {
    onClose()
  }

  function handleBack() {

    setVariant(null)
    setSavedFields(new Set())
    setBackCount(c => c + 1)

  }

  const showBackButton =
    Boolean(displayVariant) &&
    !(displayVariant === "start" && skipsSelector)

  return (

    <div
      data-drag-scroll-ignore
      onMouseDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
      onTransitionEnd={event => {

        // Solo nos interesa la transición de opacity de este
        // mismo nodo (no de hijos con sus propias transiciones),
        // y solo cuando terminó de desvanecerse (visible=false).
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
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
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

      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar"
        className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X size={14} />
      </button>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 p-4">

        {showFieldsStep && (

          numericFields.length === 1 ? (

            <div className="flex justify-center">

              <div className="w-1/2 min-w-40">

                <WorkflowNumericField
                  processTask={processTask}
                  field={numericFields[0]}
                  label={getFieldLabel(processCode, numericFields[0])}
                  disabled={locked}
                  forceEmpty={backCount > 0}
                  onSavingChange={saving =>
                    handleFieldSavingChange(numericFields[0], saving)
                  }
                  onSaved={() =>
                    handleFieldSaved(numericFields[0])
                  }
                />

              </div>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-2">

              {numericFields.map(field => (

                <WorkflowNumericField
                  key={field}
                  processTask={processTask}
                  field={field}
                  label={getFieldLabel(processCode, field)}
                  disabled={locked}
                  forceEmpty={backCount > 0}
                  onSavingChange={saving =>
                    handleFieldSavingChange(field, saving)
                  }
                  onSaved={() =>
                    handleFieldSaved(field)
                  }
                />

              ))}

            </div>

          )

        )}

        {displayVariant === "start" && (

          <div className="flex items-center justify-center rounded-lg bg-foreground/5 px-3 py-2">

            <ProcessOperatorCell
              processTask={processTask}
              onSavingChange={setOperatorSaving}
            />

          </div>

        )}

        <div className="flex flex-col gap-2">

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
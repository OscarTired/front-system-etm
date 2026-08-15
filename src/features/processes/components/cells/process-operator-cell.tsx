"use client"

import { useMemo } from "react"

import {
  UserSelect,
} from "@/features/users/components/user-select"

import {
  useAreaOperators,
  type OperatorAvailability,
} from "@/features/areas/hooks/use-area-operators"

import {
  useWorkflowStepField,
} from "@/features/workflow/hooks/use-workflow-step-field"

import {
  workflowAccess,
} from "@/features/workflow/access/workflow-access"

import type {
  ProcessTask,
} from "../../types/process.types"

type Props = {
  processTask: ProcessTask
  onSavingChange?: (saving: boolean) => void
  triggerVariant?: "badge" | "row"
  rowLabel?: string
}

const NON_EDITABLE_STATUSES = [
  "COMPLETED",
  "REVIEWED",
] as const

const STATUS_COLOR: Record<string, string> = {
  FREE: "#10B981",
  WORKING: "#F59E0B",
  PAUSED: "#737373",
  INVITED: "#38BDF8",
}

const STATUS_LABEL: Record<string, string> = {
  FREE: "Libre",
  WORKING: "Trabajando",
  PAUSED: "Pausado",
  INVITED: "Ya convocado",
}

function availabilityMeta(availability: OperatorAvailability) {
  if (availability.state === "FREE") {
    return {
      description: STATUS_LABEL.FREE,
      descriptionColor: STATUS_COLOR.FREE,
    }
  }

  return {
    description: `${STATUS_LABEL[availability.state]} · ${availability.taskLabel}`,
    descriptionColor: STATUS_COLOR[availability.state],
  }
}

/**
 * Asignación directa de operario en la celda del pipeline / rows.
 * - NO filtra operarios en PROGRESS en otra tarea: un operario puede
 *   estar trabajando en una y seguir siendo asignable en otras.
 * - Muestra el estado (Libre / Trabajando · #003 Ref / …) igual que
 *   SummonOperatorButton en TaskAreaPanel.
 * - Esta vía NO dispara notificación de convocatoria (solo summon
 *   desde TaskAreaPanel / pantalla de asignaciones).
 */
export function ProcessOperatorCell({
  processTask,
  onSavingChange,
  triggerVariant,
  rowLabel,
}: Props) {
  const updateField = useWorkflowStepField()


  const currentStepId =
    workflowAccess.stepId(processTask)

  const status =
    workflowAccess.status(processTask)

  const isEditable =
    !NON_EDITABLE_STATUSES.includes(
      status as (typeof NON_EDITABLE_STATUSES)[number],
    )

  const currentProcessCode = workflowAccess.processCode(processTask)

  const areaOperators = useAreaOperators(currentProcessCode ?? null)

  const operators = useMemo(
    () => areaOperators.map(({ user }) => user),
    [areaOperators],
  )

  const itemMeta = useMemo(() => {
    const map = new Map<
      string,
      { description?: string; descriptionColor?: string }
    >()

    for (const { user, availability } of areaOperators) {
      map.set(user.id, availabilityMeta(availability))
    }

    return map
  }, [areaOperators])

  return (
    <UserSelect
      value={workflowAccess.operator(processTask) ?? undefined}
      items={operators}
      itemMeta={itemMeta}
      placeholder="Asignar operario"
      disabled={!isEditable}
      triggerVariant={triggerVariant}
      rowLabel={rowLabel}
      onChange={async user => {
        if (!currentStepId || !isEditable) {
          return
        }

        onSavingChange?.(true)

        try {
          await updateField(
            currentStepId,
            {
              operatorId: user?.id ?? null,
            },
            {
              operator: user ?? null,
              operatorId: user?.id ?? null,
            },
          )
        } finally {
          onSavingChange?.(false)
        }
      }}
    />
  )
}

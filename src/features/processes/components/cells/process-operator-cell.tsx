"use client"

import { useMemo } from "react"

import { UserSelect } from "@/features/users/components/user-select"
import {
  useAreaOperators,
  type OperatorAvailability,
} from "@/features/areas/hooks/use-area-operators"
import { useWorkflowStepField } from "@/features/workflow/hooks/use-workflow-step-field"
import { workflowAccess } from "@/features/workflow/access/workflow-access"
import type { ProcessTask } from "../../types/process.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  processTask: ProcessTask
  onSavingChange?: (saving: boolean) => void
  triggerVariant?: "badge" | "row"
  rowLabel?: string
}

const NON_EDITABLE_STATUSES = ["COMPLETED", "REVIEWED"] as const

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
 * Multi-operario por step:
 * - values[0] → operatorId (primary)
 * - values[1..] → coOperatorIds
 */
export function ProcessOperatorCell({
  processTask,
  onSavingChange,
  triggerVariant,
  rowLabel,
}: Props) {
  const updateField = useWorkflowStepField()

  const currentStepId = workflowAccess.stepId(processTask)
  const status = workflowAccess.status(processTask)
  const isEditable = !NON_EDITABLE_STATUSES.includes(
    status as (typeof NON_EDITABLE_STATUSES)[number],
  )
  const currentProcessCode = workflowAccess.processCode(processTask)
  const areaOperators = useAreaOperators(currentProcessCode ?? null)

  const operators = useMemo(
    () => areaOperators.map(({ user }) => user),
    [areaOperators],
  )

  const byId = useMemo(() => {
    const map = new Map<string, User>()
    for (const u of operators) map.set(u.id, u)
    return map
  }, [operators])

  const selectedValues = useMemo(() => {
    const step = processTask.workflowStep
    if (!step) return [] as User[]

    const primary =
      step.operator ??
      (step.operatorId ? byId.get(step.operatorId) : undefined)

    const cos = (step.coOperatorIds ?? [])
      .map(id => byId.get(id))
      .filter((u): u is User => Boolean(u))
      .filter(u => u.id !== primary?.id)

    return primary ? [primary, ...cos] : cos
  }, [processTask.workflowStep, byId])

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
      multi
      values={selectedValues}
      items={operators}
      itemMeta={itemMeta}
      placeholder="Asignar operario"
      disabled={!isEditable}
      triggerVariant={triggerVariant}
      rowLabel={rowLabel}
      onValuesChange={async users => {
        if (!currentStepId || !isEditable) return

        const primary = users[0] ?? null
        const coOperatorIds = users.slice(1).map(u => u.id)

        onSavingChange?.(true)
        try {
          await updateField(
            currentStepId,
            {
              operatorId: primary?.id ?? null,
              coOperatorIds,
            },
            {
              operator: primary,
              operatorId: primary?.id ?? null,
              coOperatorIds,
            },
          )
        } finally {
          onSavingChange?.(false)
        }
      }}
    />
  )
}

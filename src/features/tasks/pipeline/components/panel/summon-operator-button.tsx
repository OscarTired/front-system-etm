"use client"

import { useMemo } from "react"

import { ConvocarMenu } from "@/shared/ui/convocar-menu/convocar-menu"
import { useAreaOperators } from "@/features/areas/hooks/use-area-operators"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  processCode: ProcessCode
  active?: boolean
  selectedOperatorId?: string
  onSelect: (operator: User | undefined) => void
}

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

/** Convocar operarios de un área — menú compartido. */
export function SummonOperatorButton({
  processCode,
  active,
  selectedOperatorId,
  onSelect,
}: Props) {
  const operators = useAreaOperators(processCode)

  const options = useMemo(
    () =>
      operators.map(({ user, availability }) => ({
        user,
        description:
          availability.state === "FREE"
            ? "Libre"
            : `${STATUS_LABEL[availability.state]} · ${availability.taskLabel}`,
        descriptionColor: STATUS_COLOR[availability.state],
      })),
    [operators],
  )

  return (
    <ConvocarMenu
      options={options}
      selectedUserId={selectedOperatorId}
      onSelect={onSelect}
      active={active}
      emptyLabel="No hay operarios en esta área todavía."
      variant="compact"
    />
  )
}

"use client"

import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { useThemeStore } from "@/shared/theme"

import {
  WORKFLOW_STATUS_DEFINITIONS,
} from "../constants/workflow-status-definitions"
import type { WorkflowStatus } from "../types/workflow.types"

type Props = {
  status: WorkflowStatus
  compact?: boolean
  iconOnly?: boolean
  className?: string
}

/**
 * Chip de estado de ruta/proceso (En cola, Pendiente, Proceso…).
 * Mismo contrato visual que pipeline / kanban / processes: EntityChip
 * + WORKFLOW_STATUS_DEFINITIONS. Reutilizable en ingeniería, panel de
 * áreas, filas de tarea, etc.
 */
export function WorkflowStatusChip({
  status,
  compact = false,
  iconOnly = false,
  className,
}: Props) {
  const themeResolved = useThemeStore(s => s.resolved)
  const def = WORKFLOW_STATUS_DEFINITIONS[status]

  return (
    <EntityChip
      key={`${status}-${def.color}-${themeResolved}`}
      label={def.label}
      color={def.color}
      icon={def.icon}
      compact={compact}
      iconOnly={iconOnly}
      className={className}
    />
  )
}

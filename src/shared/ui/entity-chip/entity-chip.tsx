"use client"

import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

import {
  useBadgeColors,
} from "@/shared/utils/use-badge-colors"

import {
  cn,
} from "@/shared/utils/utils"

type Props = {
  label: string
  color?: string
  icon?: EntityIcon
  // Para contextos más densos que la kanban card (ej. el stepper del
  // panel de producción, donde el chip convive con texto chico tipo
  // "(2 de 6)") — mismo chip, versión más chica.
  compact?: boolean
}

// Chip simple (ícono + label sobre fondo "subtle" del color de la
// entidad). Es el mismo patrón visual que ya usaba KanbanCardView
// para stage/status — se extrajo acá para que ambos lugares (kanban
// card y el panel de producción de la tarea) pinten exactamente el
// mismo chip en vez de tener el estilo duplicado en dos componentes.
export function EntityChip({
  label,
  color,
  icon,
  compact = false,
}: Props) {

  const Icon =
    icon &&
    ENTITY_ICONS[icon]

  const badge =
    useBadgeColors(color ?? "#64748B", "subtle")

  return (

    <div
      className={cn(
        "inline-flex items-center rounded-lg font-semibold",
        compact
          ? "gap-1.5 px-2 py-1 text-xs"
          : "gap-2 px-2.5 py-1.5 text-sm",
      )}
      style={{
        color: badge.text,
        backgroundColor: badge.background,
      }}
    >

      {Icon && <Icon size={compact ? 12 : 15} />}

      <span>{label}</span>

    </div>

  )

}
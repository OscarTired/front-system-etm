"use client"

import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import { cn } from "@/shared/utils/utils"

type Props = {
  label: string
  color?: string
  icon?: EntityIcon
  compact?: boolean
  /** Solo icono; misma altura que el chip con texto */
  iconOnly?: boolean
  className?: string
}

export function EntityChip({
  label,
  color,
  icon,
  compact = false,
  iconOnly = false,
  className,
}: Props) {
  const Icon = icon && ENTITY_ICONS[icon]
  const badge = useBadgeColors(color ?? "#64748B", "subtle")
  const iconSize = compact ? 12 : 15

  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg font-semibold",
        compact ? "gap-1.5 py-1 text-xs" : "gap-2 py-1.5 text-sm",
        iconOnly
          ? compact
            ? "justify-center px-1.5"
            : "justify-center px-2.5"
          : compact
            ? "px-2"
            : "px-2.5",
        className,
      )}
      style={{
        color: badge.text,
        backgroundColor: badge.background,
      }}
    >
      {Icon && <Icon size={iconSize} />}
      {!iconOnly && <span>{label}</span>}
    </div>
  )
}

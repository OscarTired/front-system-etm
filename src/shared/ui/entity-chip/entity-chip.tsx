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
  /** Solo icono; misma altura fija que el chip con texto */
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
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold leading-none",
        // Altura fija: iconOnly y con label miden exactamente igual
        compact ? "h-7 gap-1.5 text-xs" : "h-8 gap-2 text-sm",
        iconOnly
          ? compact
            ? "w-7 px-0"
            : "w-8 px-0"
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
      {Icon && <Icon size={iconSize} className="shrink-0" />}
      {!iconOnly && <span className="leading-none">{label}</span>}
    </div>
  )
}

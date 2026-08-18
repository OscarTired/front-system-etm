"use client"

import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import type { BadgeVariant } from "@/shared/utils/badge-colors"
import { cn } from "@/shared/utils/utils"

type Props = {
  label: string
  color?: string
  icon?: EntityIcon
  compact?: boolean
  /** Solo icono; misma altura fija que el chip con texto */
  iconOnly?: boolean
  /**
   * subtle = chip de lista (default).
   * solid = color de dominio lleno — iconOnly de estado (reloj) necesita
   * el mismo peso visual que un chip con label (SD), sin retocar el motor.
   */
  variant?: BadgeVariant
  className?: string
}

export function EntityChip({
  label,
  color,
  icon,
  compact = false,
  iconOnly = false,
  variant = "subtle",
  className,
}: Props) {
  const Icon = icon && ENTITY_ICONS[icon]
  const badge = useBadgeColors(color ?? "#64748B", variant)
  const iconSize = compact ? 12 : 15

  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold leading-none shadow-sm",
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

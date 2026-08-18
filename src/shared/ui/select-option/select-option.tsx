"use client"

import { useMemo, type ReactNode } from "react"
import { Check } from "lucide-react"
import { CommandItem } from "@/components/ui/command"
import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"
import {
  EntityNameLabel,
} from "@/shared/ui/entity-name-label/entity-name-label"
import {
  EntitySelectActionMenu,
} from "@/shared/ui/entity-select/actions/entity-select-actions"
import {
  useBadgeColors,
  useDomainInk,
} from "@/shared/utils/use-badge-colors"
import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"
import {
  cn,
} from "@/shared/utils/utils"
import { MarqueeText } from "@/shared/ui/marquee-text/marquee-text"

type Props = {
  label: string
  icon?: EntityIcon
  color: string
  selected: boolean
  /** Chip u otro nodo a la izquierda (ej. código de proyecto). */
  leading?: ReactNode
  swatchColor?: string
  disableCheckAnimation?: boolean
  rightSlot?: React.ReactNode
  variant?: "default" | "color"
  description?: string
  descriptionColor?: string
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function SelectOption({
  label,
  icon,
  color,
  selected,
  leading,
  swatchColor,
  disableCheckAnimation,
  rightSlot,
  variant = "default",
  description,
  descriptionColor,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  // 1. Sanitización defensiva a nivel de componente.
  // Remueve saltos de línea (\r, \n) y colapsa espacios múltiples.
  const cleanLabel = useMemo(
    () => label.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim(),
    [label],
  )

  const cleanDescription = useMemo(
    () =>
      description
        ? description.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
        : undefined,
    [description],
  )

  const Icon = icon ? ENTITY_ICONS[icon] : undefined
  const resolvedColor = swatchColor ?? color
  const badge = useBadgeColors(resolvedColor, "solid")
  // Lista neutra: mismo camino que nombres (domainInk), no hex crudo.
  const ink = useDomainInk(resolvedColor)
  const isColor = variant === "color"

  const actions = {
    edit: onEdit,
    delete: onDelete,
  }
  const hasActions = !!(actions.edit || actions.delete)
  const actionColor = selected && isColor ? badge.text : "var(--muted-foreground)"
  const { isMobile } = useResponsive()

  return (
    <CommandItem
      value={cleanLabel}
      onSelect={onSelect}
      className="group mb-0.5 last:mb-0 w-full cursor-pointer rounded-xl border-0 px-3 py-2.5 transition-all duration-150 select-none"
      style={{
        background: selected && isColor ? badge.background : undefined,
      }}
    >
      <div className="flex w-full items-center justify-between gap-3 min-w-0">
        {/* Sección Izquierda: Ícono + Nombre + Descripción */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {leading}
          {!leading && Icon && (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all"
              style={{
                background: isColor
                  ? badge.background
                  : "var(--muted)",
                boxShadow: isColor ? badge.shadow.default : undefined,
              }}
            >
              <Icon
                size={18}
                strokeWidth={2}
                style={{
                  color: isColor ? badge.text : ink,
                }}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <EntityNameLabel
              name={cleanLabel}
              className="block truncate whitespace-nowrap text-xs font-semibold tracking-[-0.01em]"
              style={{
                color: isColor && selected ? badge.text : "var(--foreground)",
              }}
            />

            {cleanDescription && (
              <MarqueeText className="min-w-0" speed={28} delay={1.5}>
                <span
                  className="text-[11px] font-medium whitespace-nowrap"
                  style={{ color: descriptionColor ?? "var(--muted-foreground)" }}
                >
                  {cleanDescription}
                </span>
              </MarqueeText>
            )}
          </div>
        </div>

        {/* Sección Derecha: Acciones / Checkmark (shrink-0 previene colapso en textos largos) */}
        <div className="relative flex h-8 min-w-8 shrink-0 items-center justify-end gap-2">
          {rightSlot}

          {hasActions && (
            <div
              className={cn(
                "absolute right-0 transition-all duration-200",
                isMobile
                  ? "translate-x-0 opacity-100"
                  : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
              )}
              onPointerDown={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <EntitySelectActionMenu
                onEdit={actions.edit}
                onDelete={actions.delete}
                color={actionColor}
              />
            </div>
          )}

          {selected && (
            <Check
              size={16}
              strokeWidth={2.5}
              style={{
                color: isColor ? badge.text : ink,
              }}
              className={cn(
                "transition-all duration-200",
                !disableCheckAnimation &&
                  hasActions &&
                  (isMobile
                    ? "-translate-x-10"
                    : "group-hover:-translate-x-10"),
              )}
            />
          )}
        </div>
      </div>
    </CommandItem>
  )
}
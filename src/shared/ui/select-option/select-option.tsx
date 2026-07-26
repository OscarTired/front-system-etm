"use client"
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
  getBadgeColors,
} from "@/shared/utils/badge-colors"
import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"
import {
  cn,
} from "@/shared/utils/utils"

type Props = {
  label: string
  icon?: EntityIcon
  color: string
  selected: boolean
  swatchColor?: string
  disableCheckAnimation?: boolean
  rightSlot?: React.ReactNode
  variant?: "default" | "color"
  // Segunda línea opcional debajo del label — ej. el estado de
  // disponibilidad de un operario ("Libre", "Trabajando · #003").
  // Nadie más lo usaba hasta ahora, así que no rompe ningún caller
  // existente.
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
  const Icon =
    icon
      ? ENTITY_ICONS[icon]
      : undefined
  const resolvedColor =
    swatchColor ?? color
  const badge =
    getBadgeColors(
      resolvedColor,
      "solid",
    )
  const isColor =
    variant === "color"
  const actions = {
    edit: onEdit,
    delete: onDelete,
  }
  const hasActions =
    !!(
      actions.edit ||
      actions.delete
    )
  const actionColor =
    selected && isColor
      ? badge.text
      : "#A1A1AA" // zinc-400
  const { isMobile } = useResponsive()

  return (
    <CommandItem
      value={label}
      onSelect={onSelect}
      className="group mb-0.5 last:mb-0 w-full cursor-pointer rounded-xl border-0 px-3 py-2.5 transition-all duration-150"
      style={{
        background:
          selected && isColor
            ? badge.background
            : undefined,
      }}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all"
              style={{
                background: isColor
                  ? badge.background
                  : "rgba(255,255,255,0.05)",
                boxShadow: isColor
                  ? badge.shadow.default
                  : undefined,
              }}
            >
              <Icon
                size={18}
                strokeWidth={2}
                style={{
                  color: isColor
                    ? badge.text
                    : resolvedColor,
                }}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <EntityNameLabel
              name={label}
              className="truncate text-xs font-semibold tracking-[-0.01em]"
              style={{
                color:
                  isColor && selected
                    ? badge.text
                    : "#F5F5F5",
              }}
            />

            {description && (
              <p
                className="truncate text-[11px] font-medium"
                style={{ color: descriptionColor ?? "#737373" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="relative flex h-8 min-w-8 items-center justify-end gap-2">
          {rightSlot}
          {hasActions && (
            <div
              className={cn(
                "absolute right-0 transition-all duration-200",
                isMobile
                  ? "translate-x-0 opacity-100"
                  : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
              )}
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
                color: isColor
                  ? badge.text
                  : resolvedColor,
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
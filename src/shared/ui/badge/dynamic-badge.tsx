"use client"

import { useState } from "react"

import {
  ChevronDown,
  LucideIcon,
  Plus,
  X,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  type BadgeVariant,
} from "@/shared/utils/badge-colors"
import {
  useBadgeColors,
} from "@/shared/utils/use-badge-colors"

import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

type DynamicBadgeProps = {
  label: string
  color: string
  icon?: EntityIcon
  iconComponent?: LucideIcon
  variant?: BadgeVariant
  muted?: boolean
  active?: boolean
  pulse?: boolean
  placeholder?: boolean
  showChevron?: boolean
  chevronOpen?: boolean
  showRemove?: boolean
  onRemove?: () => void
  compact?: boolean
  reserveActionsSpace?: boolean
  width?: "content" | "field" | "project" | "process"
}

const widthClasses = {
  content: "px-2.5",
  field: "w-full px-2.5",
  project: "w-[560px] px-3",
  process: "w-[90px] px-2",
} as const

export function DynamicBadge({
  label,
  color,
  icon,
  iconComponent,
  variant = "subtle",
  muted = false,
  active = false,
  pulse = false,
  placeholder = false,
  showChevron = false,
  chevronOpen = false,
  showRemove = false,
  onRemove,
  compact = false,
  width = "content",
  reserveActionsSpace = false,
}: DynamicBadgeProps) {
  const { isMobile } = useResponsive()

  const resolvedWidthClass =
    width === "project" && isMobile
      ? "w-full px-3"
      : widthClasses[width]

  const safeHex = color ?? "#64748B"
  const badgeColors = useBadgeColors(safeHex, variant)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const Icon = placeholder
    ? Plus
    : iconComponent
      ? iconComponent
      : icon
        ? ENTITY_ICONS[icon]
        : undefined

  const textColor = placeholder || muted
    ? "var(--muted-foreground)"
    : badgeColors.text

  const backgroundColor =
    placeholder || muted
      ? "var(--muted)"
      : active || pressed
        ? badgeColors.backgroundActive
        : hovered
          ? badgeColors.backgroundHover
          : badgeColors.background

  const actionColor = muted
    ? "var(--muted-foreground)"
    : badgeColors.text

  return (
    <span
      className={cn(
        "group relative inline-flex min-w-0 select-none items-center rounded-lg text-xs font-semibold uppercase tracking-[0.06em]",
        compact ? "h-8" : "min-h-8 py-1.5",
        "transition duration-150 ease-out",
        "border-0 outline-none ring-0",
        "focus:border-0 focus:outline-none focus:ring-0",
        "focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0",
        pulse && "animate-pulse",
        resolvedWidthClass,
      )}
      style={{
        color: textColor,
        backgroundColor,
        // Sin border / ring / box-shadow de contorno
        boxShadow: "none",
      }}
      onMouseDown={event => {
        event.preventDefault()
        if (muted || placeholder) return
        setPressed(true)
      }}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => {
        setPressed(false)
        setHovered(false)
      }}
      onMouseEnter={() => {
        if (muted || placeholder || active) return
        setHovered(true)
      }}
      onTouchStart={() => {
        if (muted || placeholder) return
        setPressed(true)
      }}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
    >
      <div
        className={cn(
          "w-full items-center",
          showChevron || showRemove
            ? "grid grid-cols-[1fr_auto_1fr] gap-x-2"
            : "flex justify-center",
        )}
      >
        {(showChevron || showRemove) && <span aria-hidden />}

        <div className="flex min-w-0 items-center justify-center gap-1.5">
          {Icon && (
            <span className="flex shrink-0 items-center justify-center leading-none">
              <Icon size={14} />
            </span>
          )}

          <span className="min-w-0 truncate leading-none">{label}</span>
        </div>

        {(showChevron || showRemove) && (
          <div className="relative ml-auto flex size-5 shrink-0 items-center justify-center">
            {showChevron && (
              <ChevronDown
                size={14}
                style={{ color: actionColor }}
                className={cn(
                  "absolute inset-0 m-auto transition duration-200 ease-out",
                  showRemove &&
                    "opacity-0 tablet:opacity-50 tablet:group-hover:scale-75 tablet:group-hover:opacity-0",
                  !showRemove && "opacity-50",
                  chevronOpen && "rotate-180",
                )}
              />
            )}

            {showRemove && onRemove && (
              <span
                role="button"
                tabIndex={0}
                onClick={event => {
                  event.preventDefault()
                  event.stopPropagation()
                  onRemove()
                }}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onRemove()
                  }
                }}
                style={{ color: actionColor }}
                className={cn(
                  "absolute inset-0 flex cursor-pointer items-center justify-center rounded-md",
                  "transition-opacity duration-150",
                  "border-0 outline-none ring-0",
                  "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                  "opacity-100 tablet:opacity-70 tablet:group-hover:opacity-100",
                )}
              >
                <X size={14} strokeWidth={2.5} />
              </span>
            )}
          </div>
        )}
      </div>
    </span>
  )
}

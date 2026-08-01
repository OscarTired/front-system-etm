"use client"

import { cn } from "@/shared/utils/utils"

export function sidebarRowClassName({
  collapsed,
  active,
}: {
  collapsed?: boolean
  active?: boolean
}) {
  return cn(
    "mx-1 flex h-8 min-w-0 items-center rounded-md text-sm font-medium transition-colors",
    collapsed ? "justify-center px-0" : "gap-2 px-3",
    active
      ? "bg-white/6 text-white"
      : "text-neutral-400 hover:bg-white/4 hover:text-white",
  )
}

type Props = {
  icon: React.ElementType
  label: string
  collapsed?: boolean
  active?: boolean
  count?: number | string
  collapsedBadgeColor?: string
  badgeColor?: string
  badgeAnimated?: boolean
  isDrawer?: boolean
  size?: "default" | "sm"
}

export function SidebarRow({
  icon: Icon,
  label,
  collapsed,
  active,
  count,
  collapsedBadgeColor = "bg-blue-500 text-white",
  badgeColor = active ? "bg-white/5 text-white" : "bg-white/5 text-neutral-400",
  badgeAnimated = false,
  isDrawer = false,
  size = "default",
}: Props) {
  const hasVisibleCount =
    count !== undefined &&
    (typeof count === "string" || count > 0)

  const iconSize = isDrawer ? 19 : 14

  const badgeStyles = {
    default: "h-5 px-1.5 min-w-5 text-[9px]",
    sm: "h-4 px-1 min-w-4 text-[9px]",
  }

  const containerClassName = isDrawer
    ? cn(
        "flex h-12 w-full min-w-0 items-center gap-3 rounded-xl px-4 font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-neutral-300 hover:bg-white/5 hover:text-white active:bg-white/10 active:text-white"
      )
    : undefined

  return (
    <div className={cn("flex w-full min-w-0 items-center gap-2.5", containerClassName)}>
      <span className={cn(
        "relative flex shrink-0 items-center justify-center",
        collapsed && "size-8"
      )}>
        <Icon size={iconSize} className="shrink-0" />

        {collapsed && hasVisibleCount && (
          <span className={cn(
            "absolute -right-1 -top-1 flex items-center justify-center rounded-full font-bold shadow-sm pointer-events-none",
            badgeStyles.sm,
            collapsedBadgeColor,
          )}>
            {count}
          </span>
        )}
      </span>

      {!collapsed && (
        <span className={cn(
          "min-w-0 flex-1 truncate text-left font-medium",
          isDrawer ? "text-base" : "text-sm"
        )}>
          {label}
        </span>
      )}

      {isDrawer && count !== undefined && (
        <span className={cn("shrink-0 text-xs font-semibold tabular-nums", active ? "text-white" : "text-neutral-500")}>
          {count}
        </span>
      )}

      {!isDrawer && !collapsed && count !== undefined && (
        <span
          className={cn(
            "ml-auto flex shrink-0 items-center justify-center rounded-md font-bold",
            badgeStyles[size],
            badgeColor,
            badgeAnimated && "animate-pulse",
          )}
        >
          {count}
        </span>
      )}
    </div>
  )
}
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
}: Props) {

  const hasVisibleCount =
    count !== undefined &&
    (typeof count === "string" || count > 0)

  return (
    <>
      <span className="relative flex shrink-0 items-center justify-center">
        <Icon size={14} />

        {collapsed && hasVisibleCount && (
          <span className={cn(
            "absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold",
            collapsedBadgeColor,
          )}>
            {count}
          </span>
        )}
      </span>

      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-left">
          {label}
        </span>
      )}

      {!collapsed && count !== undefined && (
        <span
          className={cn(
            "ml-auto flex h-6 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
            badgeColor,
            badgeAnimated && "animate-pulse",
          )}
        >
          {count}
        </span>
      )}
    </>
  )
}
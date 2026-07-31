"use client"

import Link from "next/link"
import { cn } from "@/shared/utils/utils"

type Props = {
  href: string
  label: string
  active: boolean
  icon: React.ElementType
  count?: number
  collapsed?: boolean
  isDrawer?: boolean
  onMouseEnter?: () => void
  onTouchStart?: () => void
}

export function SidebarItem({
  href,
  label,
  active,
  icon: Icon,
  count,
  collapsed,
  isDrawer = false,
  onMouseEnter,
  onTouchStart,
}: Props) {
  if (isDrawer) {
    return (
      <Link
        href={href}
        onMouseEnter={onMouseEnter}
        onTouchStart={onTouchStart}
        className={cn(
          "flex h-12 min-w-0 items-center gap-3 rounded-xl px-4 text-base font-medium transition-colors",
          active
            ? "bg-white/10 text-white pointer-events-none"
            : "text-neutral-300 hover:bg-white/5 hover:text-white", // 👈 Quitamos active:
        )}
      >
        <Icon size={19} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              "shrink-0 text-sm font-semibold tabular-nums",
              active ? "text-white" : "text-neutral-500",
            )}
          >
            {count}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      className={cn(
        "mx-1 flex h-8 min-w-0 items-center rounded-md text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "gap-2 px-3",
        active
          ? "bg-white/6 text-white pointer-events-none"
          : "text-neutral-400 hover:bg-white/4 hover:text-white", // 👈 Quitamos active:bg-white/8 active:text-white de aquí también
      )}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        <Icon size={14} />

        {collapsed && count !== undefined && count > 0 && (
          <span className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </span>

      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">
          {label}
        </span>
      )}

      {!collapsed && count !== undefined && (
        <span
          className={cn(
            "ml-auto flex h-6 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold",
            active ? "text-white" : "text-neutral-400",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
"use client"

import Link from "next/link"
import { cn } from "@/shared/utils/utils"
import { SidebarRow, sidebarRowClassName } from "../sidebar/sidebar-row"

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
        sidebarRowClassName({ collapsed, active }),
        active && "pointer-events-none",
      )}
    >
      <SidebarRow
        icon={Icon}
        label={label}
        collapsed={collapsed}
        active={active}
        count={count}
      />
    </Link>
  )
}
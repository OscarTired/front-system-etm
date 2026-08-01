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
        className={cn(active && "pointer-events-none")}
      >
        <SidebarRow
          icon={Icon}
          label={label}
          active={active}
          count={count}
          isDrawer
        />
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
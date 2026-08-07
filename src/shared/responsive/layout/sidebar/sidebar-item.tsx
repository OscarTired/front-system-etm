"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils/utils"
import { SidebarRow } from "../sidebar/sidebar-row"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"

type Props = {
  href: string
  label: string
  active: boolean
  icon: LucideIcon
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
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  // Procesos usa /processes?code=xx (mismo pathname). Hay que cerrar en el
  // click, no solo cuando cambia pathname — si no, en "producción" el
  // drawer se queda abierto.
  const handleNavigate = () => {
    if (isDrawer) closeDrawer()
  }

  if (isDrawer) {
    return (
      <Link
        href={href}
        onClick={handleNavigate}
        onMouseEnter={onMouseEnter}
        onTouchStart={onTouchStart}
        className={cn("w-full block", active && "pointer-events-none")}
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
      className={cn("w-full block", active && "pointer-events-none")}
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
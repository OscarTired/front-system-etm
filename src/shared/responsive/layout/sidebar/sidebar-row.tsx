"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils/utils"

export const sidebarRowClassName = ({
  collapsed = false,
  active = false,
}: {
  collapsed?: boolean
  active?: boolean
}) =>
  cn(
    "relative flex w-full items-center gap-3 rounded-xl text-xs font-medium transition-all duration-300 ease-in-out select-none",
    collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
    active
      ? "bg-white/15 text-white shadow-sm"
      : "text-neutral-300 hover:bg-white/5 hover:text-white active:bg-white/10 active:text-white"
  )

export type SidebarRowProps = {
  icon: LucideIcon | React.ElementType
  label: string
  collapsed?: boolean
  active?: boolean
  count?: number | string
  badgeColor?: string
  collapsedBadgeColor?: string
  badgeAnimated?: boolean
  isDrawer?: boolean
  size?: "sm" | "md"
}

export function SidebarRow({
  icon: Icon,
  label,
  collapsed = false,
  active = false,
  count,
  badgeColor = "bg-white/10 text-white",
  collapsedBadgeColor = "bg-cyan-500 text-white",
  badgeAnimated = false,
  size = "md",
}: SidebarRowProps) {
  return (
    <div className={sidebarRowClassName({ collapsed, active })}>
      {/* El ícono maneja su escala y desplazamiento interno al colapsar */}
      <div className="relative flex shrink-0 items-center justify-center transition-transform duration-300 ease-in-out">
        <Icon
          size={size === "sm" ? 16 : 18}
          className={cn(
            "shrink-0 transition-all duration-300 ease-in-out",
            active ? "text-white scale-105" : "text-neutral-400 group-hover:text-white",
            collapsed && "scale-110"
          )}
        />

        {/* Badge colapsado */}
        {collapsed && count !== undefined && (
          <span
            className={cn(
              "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold shadow-md transition-all duration-300",
              collapsedBadgeColor,
              badgeAnimated && "animate-pulse"
            )}
          >
            {count}
          </span>
        )}
      </div>

      {/* Texto desplegado */}
      {!collapsed && (
        <span
          className={cn(
            "flex-1 truncate transition-opacity duration-300 ease-in-out",
            active ? "font-semibold text-white" : "text-neutral-300"
          )}
        >
          {label}
        </span>
      )}

      {/* Badge expandido */}
      {!collapsed && count !== undefined && (
        <span
          className={cn(
            "ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-all duration-300",
            badgeColor,
            badgeAnimated && "animate-pulse"
          )}
        >
          {count}
        </span>
      )}
    </div>
  )
}
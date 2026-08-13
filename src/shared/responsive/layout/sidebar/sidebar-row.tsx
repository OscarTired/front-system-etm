"use client"

import React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils/utils"

// Cambiamos ButtonHTMLAttributes<HTMLButtonElement> por HTMLAttributes<HTMLDivElement>
export type SidebarRowProps = React.HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon
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
  badgeColor = "bg-sidebar-accent text-muted-foreground",
  collapsedBadgeColor,
  badgeAnimated = false,
  isDrawer = false,
  size = "md",
  className,
  ...props
}: SidebarRowProps) {
  const hasCount = count !== undefined && count !== null && count !== ""

  return (
    <div
      className={cn(
        "group relative flex w-full items-center rounded-xl font-medium transition-colors duration-200 select-none overflow-visible",
        size === "sm" ? "h-9 text-xs" : "h-10 text-xs font-semibold",
        active
          ? "bg-foreground/10 text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        collapsed ? "justify-center px-0" : "px-2.5",
        className
      )}
      {...props}
    >
      {/* Contenedor fijo de 32x32px (size-8) */}
      <div className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
          strokeWidth={2}
        />

        {/* Burbuja en modo COLAPSADO */}
        {collapsed && hasCount && (
          <span
            className={cn(
              "absolute -top-1 -right-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none transition-all pointer-events-none",
              collapsedBadgeColor || badgeColor,
              badgeAnimated && "animate-pulse"
            )}
          >
            {count}
          </span>
        )}
      </div>

      {/* Contenido en modo EXPANDIDO */}
      {!collapsed && (
        <div className="ml-2 flex flex-1 items-center justify-between min-w-0 pr-1">
          <span className="truncate">{label}</span>

          {/* Burbuja en modo EXPANDIDO */}
          {hasCount && (
            <span
              className={cn(
                "ml-2 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none transition-all",
                badgeColor,
                badgeAnimated && "animate-pulse"
              )}
            >
              {count}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
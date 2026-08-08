"use client"

import { getActivityIcon } from "../constants/activity-icons"
import type { ActivityLog } from "../types/activity-log.types"
import { cn } from "@/shared/utils/utils"

type Props = {
  log: ActivityLog
  compact?: boolean
  onClick?: () => void
  className?: string
}

export function ActivityLogChip({
  log,
  compact = false,
  onClick,
  className,
}: Props) {
  const Icon = getActivityIcon(log.activityType?.icon)
  const color = log.activityType?.color ?? "#22d3ee"

  return (
    <button
      type="button"
      onClick={onClick}
      title={log.activityType?.label}
      style={{
        backgroundColor: `${color}12`,
        color,
      }}
      className={cn(
        "group relative flex w-full min-w-0 items-center rounded-xl p-2 text-left",
        "border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
        "transition-all duration-200 hover:brightness-110 active:scale-[0.99]",
        "justify-center md:flex-col md:items-stretch",
        className,
      )}
    >
      {/* Contenedor superior / Modo Icono */}
      <div className="flex w-full items-center justify-center md:justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* Contenedor del ícono totalmente estático y aislado de herencias de layout */}
          <div 
            className="flex h-7 w-7 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-lg pointer-events-none select-none"
            style={{ 
              backgroundColor: `${color}25`,
              boxShadow: `inset 0 0 0 1px ${color}30`
            }}
          >
            <Icon size={15} strokeWidth={2.5} className="shrink-0 block" />
          </div>

          <span
            className={cn(
              "hidden md:block font-bold tracking-wide truncate text-xs",
              compact && "text-[11px]",
            )}
          >
            {log.activityType?.label}
          </span>
        </div>

        {log.source === "AUTO" && (
          <span className="hidden md:inline-block shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-black/40 text-white/90">
            Auto
          </span>
        )}
      </div>

      {/* Detalles desplegados en escritorio si no está en modo compacto */}
      {!compact && (
        <div className="hidden md:flex mt-2 w-full flex-col gap-1 border-t border-white/5 pt-1.5">
          {log.project && (
            <span className="text-[10px] font-medium text-neutral-300 truncate flex items-center gap-1">
              <span className="opacity-70">📁</span> {log.project.name}
            </span>
          )}
          {log.note && (
            <p className="line-clamp-2 text-[11px] text-neutral-400 font-normal leading-relaxed">
              {log.note}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
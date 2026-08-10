"use client"

import { getActivityIcon } from "../../constants/activity-icons"
import type { ActivityLog } from "../../types/activity-log.types"
import { cn } from "@/shared/utils/utils"

type Props = {
  log: ActivityLog
  compact?: boolean
  onClick?: () => void
  className?: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ActivityLogChip({
  log,
  compact = false,
  onClick,
  className,
}: Props) {
  const Icon = getActivityIcon(log.activityType?.icon)
  const color = log.activityType?.color ?? "#22d3ee"
  const label = log.activityType?.label ?? "Actividad"
  const subtitle = log.project
    ? log.project.name
    : log.note?.trim() || null

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${formatTime(log.loggedAt)} ${label}${subtitle ? ` — ${subtitle}` : ""}`}
      style={{
        backgroundColor: `${color}14`,
        color,
      }}
      className={cn(
        "group relative flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left",
        "border-0 outline-none ring-0 shadow-none",
        "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
        "transition-all duration-200 hover:brightness-110 active:scale-[0.99]",
        // Desktop no-compact: columna con detalle debajo
        !compact && "md:flex-col md:items-stretch md:gap-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-2",
          !compact && "md:justify-between",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-lg pointer-events-none select-none md:size-6"
            style={{
              backgroundColor: `${color}28`,
              boxShadow: `inset 0 0 0 1px ${color}35`,
            }}
          >
            <Icon size={15} strokeWidth={2.5} className="block shrink-0" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "truncate font-bold tracking-wide text-xs",
                  compact && "text-[11px]",
                )}
              >
                {label}
              </span>
              {log.source === "AUTO" && (
                <span className="shrink-0 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white/90">
                  Auto
                </span>
              )}
            </div>
            {/* Móvil: subtítulo bajo el nombre */}
            {subtitle && (
              <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-400 md:hidden">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <span className="shrink-0 text-[10px] tabular-nums text-neutral-500 md:hidden">
          {formatTime(log.loggedAt)}
        </span>
      </div>

      {/* Desktop: detalle debajo si no es compact */}
      {!compact && (
        <div className="mt-2 hidden w-full flex-col gap-1 border-t border-white/5 pt-1.5 md:flex">
          <span className="text-[10px] tabular-nums text-neutral-500">
            {formatTime(log.loggedAt)}
          </span>
          {log.project && (
            <span className="flex items-center gap-1 truncate text-[10px] font-medium text-neutral-300">
              <span className="opacity-70">📁</span> {log.project.name}
            </span>
          )}
          {log.note && (
            <p className="line-clamp-2 text-[11px] font-normal leading-relaxed text-neutral-400">
              {log.note}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
"use client"

import { memo } from "react"
import { getActivityIcon } from "../../constants/activity-icons"
import type { ActivityLog } from "../../types/activity-log.types"
import { cn } from "@/shared/utils/utils"
import { ActivityLogDetailIndicators } from "./activity-log-detail-indicators"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"

type Props = {
  log?: ActivityLog
  loading?: boolean
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

export const ActivityLogChip = memo(function ActivityLogChip({
  log,
  loading = false,
  compact = false,
  onClick,
  className,
}: Props) {
  const Icon = log ? getActivityIcon(log.activityType?.icon) : null
  const color = log?.activityType?.color ?? "#22d3ee"
  const label = log?.activityType?.label ?? "Actividad"
  const subtitle = log?.project
    ? log.project.name
    : log?.note?.trim() || null

  const badge = useBadgeColors(color, "solid")

  if (compact) {
    if (loading || !log) {
      return (
        <div
          className={cn(
            "flex h-6 w-full min-w-0 items-center gap-1 rounded-md px-1.5 animate-pulse bg-foreground/8",
            className
          )}
          aria-hidden
        >
          <span className="size-3 shrink-0 rounded-sm bg-foreground/12" />
          <span className="h-2 w-3/5 rounded bg-foreground/10" />
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={onClick}
        title={`${formatTime(log.loggedAt)} · ${label}${subtitle ? ` — ${subtitle}` : ""}`}
        className={cn(
          "inline-flex h-6 w-full min-w-0 select-none items-center gap-1 rounded-md px-1.5 text-left",
          "transition-colors duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "hover:opacity-90",
          className
        )}
        style={{ backgroundColor: badge.background, color: badge.text }}
      >
        {Icon && (
          <Icon size={11} strokeWidth={2.5} className="block shrink-0" style={{ color: badge.text }} />
        )}
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-none tracking-tight">
          {label}
        </span>
      </button>
    )
  }

  const shellClass = cn(
    "group relative inline-flex w-full min-w-0 select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-left",
    "transition-colors duration-150 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    !loading && "hover:opacity-90",
    loading && "pointer-events-none animate-pulse",
    "md:flex-col md:items-stretch md:gap-0",
    className
  )

  if (loading || !log) {
    return (
      <div className={shellClass} style={{ backgroundColor: "var(--muted)" }} aria-hidden>
        <div className="flex w-full min-w-0 items-center gap-2 md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="size-7 shrink-0 rounded-lg bg-foreground/10 md:size-6" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-2/5 rounded bg-foreground/12" />
              <div className="h-2.5 w-3/5 rounded bg-foreground/10 md:hidden" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${formatTime(log.loggedAt)} ${label}${subtitle ? ` — ${subtitle}` : ""}`}
      className={shellClass}
      style={{ backgroundColor: badge.background, color: badge.text }}
    >
      <div className="flex w-full min-w-0 items-center gap-2 md:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-lg pointer-events-none select-none md:size-6"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            {Icon && (
              <Icon size={15} strokeWidth={2.5} className="block shrink-0" style={{ color: badge.text }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs font-bold tracking-wide">{label}</span>
              <ActivityLogDetailIndicators log={log} compact />
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-[10px] font-medium md:hidden" style={{ color: badge.textMuted }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[10px] tabular-nums md:hidden" style={{ color: badge.textMuted }}>
          {formatTime(log.loggedAt)}
        </span>
      </div>
      <div
        className="mt-2 hidden w-full flex-col gap-1 border-t pt-1.5 md:flex"
        style={{ borderColor: "rgba(255,255,255,0.18)" }}
      >
        <span className="text-[10px] tabular-nums" style={{ color: badge.textMuted }}>
          {formatTime(log.loggedAt)}
        </span>
        {log.project && (
          <span className="truncate text-[10px] font-medium" style={{ color: badge.textMuted }}>
            {log.project.name}
          </span>
        )}
        {log.note && (
          <p className="line-clamp-2 text-[11px] font-normal leading-relaxed" style={{ color: badge.textMuted }}>
            {log.note}
          </p>
        )}
      </div>
    </button>
  )
})
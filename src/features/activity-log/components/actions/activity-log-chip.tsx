"use client"

import { getActivityIcon } from "../../constants/activity-icons"
import type { ActivityLog } from "../../types/activity-log.types"
import { cn } from "@/shared/utils/utils"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"

type Props = {
  /** Obligatorio salvo en estado loading. */
  log?: ActivityLog
  /** Mismo layout del chip; solo pulse + slots vacíos. */
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

export function ActivityLogChip({
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

  // Tokens de tema (misma ruta que DynamicBadge): texto legible en light/dark.
  // Evita `${hex}14` hardcode que en light deja pasteles ilegibles.
  const badge = useBadgeColors(color, "subtle")

  const shellClass = cn(
    "group relative flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left",
    "border-0 outline-none ring-0 shadow-none",
    "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
    !loading && "transition-all duration-200 hover:brightness-110 active:scale-[0.99]",
    loading && "pointer-events-none animate-pulse",
    !compact && "md:flex-col md:items-stretch md:gap-0",
    className,
  )

  if (loading || !log) {
    return (
      <div
        className={shellClass}
        style={{ backgroundColor: "var(--muted)" }}
        aria-hidden
      >
        <div
          className={cn(
            "flex w-full min-w-0 items-center gap-2",
            !compact && "md:justify-between",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="size-7 shrink-0 rounded-lg bg-foreground/10 md:size-6" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-2/5 rounded bg-foreground/12" />
              <div className="h-2.5 w-3/5 rounded bg-foreground/10 md:hidden" />
            </div>
          </div>
          <div className="h-2.5 w-8 shrink-0 rounded bg-foreground/10 md:hidden" />
        </div>
        {!compact && (
          <div className="mt-2 hidden w-full border-t border-border pt-1.5 md:block">
            <div className="h-2.5 w-12 rounded bg-foreground/10" />
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${formatTime(log.loggedAt)} ${label}${subtitle ? ` — ${subtitle}` : ""}`}
      style={{
        backgroundColor: badge.background,
        color: badge.text,
      }}
      className={shellClass}
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
              backgroundColor: badge.backgroundHover,
              boxShadow: `inset 0 0 0 1px ${color}40`,
            }}
          >
            {Icon && (
              <Icon size={15} strokeWidth={2.5} className="block shrink-0" />
            )}
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
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Auto
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground md:hidden">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground md:hidden">
          {formatTime(log.loggedAt)}
        </span>
      </div>

      {!compact && (
        <div className="mt-2 hidden w-full flex-col gap-1 border-t border-border pt-1.5 md:flex">
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {formatTime(log.loggedAt)}
          </span>
          {log.project && (
            <span className="flex items-center gap-1 truncate text-[10px] font-medium text-muted-foreground">
              <span className="opacity-70">📁</span> {log.project.name}
            </span>
          )}
          {log.note && (
            <p className="line-clamp-2 text-[11px] font-normal leading-relaxed text-muted-foreground">
              {log.note}
            </p>
          )}
        </div>
      )}
    </button>
  )
}

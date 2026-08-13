"use client"

import { ChevronDown } from "lucide-react"

import { ENTITY_ICONS, type EntityIcon } from "@/shared/constants/entity-icons"
import { cn } from "@/shared/utils/utils"

import type { TeamUserCompliance } from "../../types/team-supervision.types"
import type { ActivityLog } from "../../types/activity-log.types"
import {
  SHIFT_GROUPS,
  SHIFT_HOURS_LABEL,
  getCurrentShift,
} from "../../constants/shift-definitions"
import { getActivityIcon } from "../../constants/activity-icons"

type Props = {
  row?: TeamUserCompliance
  expanded?: boolean
  onToggle?: () => void
  loading?: boolean
}

const STATUS_META: Record<
  TeamUserCompliance["status"],
  { label: string; className: string }
> = {
  ok: {
    label: "OK",
    className: "text-emerald-400 bg-emerald-500/10",
  },
  partial: {
    label: "Parcial",
    className: "text-amber-400 bg-amber-500/10",
  },
  missing: {
    label: "Sin registro",
    className: "text-rose-400 bg-rose-500/10",
  },
}

function UserAvatar({
  name,
  color,
  icon,
}: {
  name: string
  color: string
  icon?: EntityIcon
}) {
  const Icon = icon ? ENTITY_ICONS[icon] : undefined
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        backgroundColor: `${color}28`,
        color,
      }}
    >
      {Icon ? <Icon size={15} /> : initial}
    </div>
  )
}

function MiniLog({ log }: { log: ActivityLog }) {
  const Icon = getActivityIcon(log.activityType.icon)
  const shift = log.shift ?? getCurrentShift(new Date(log.loggedAt))

  return (
    <div className="flex items-start gap-3 rounded-xl bg-foreground/5 px-3 py-2.5">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${log.activityType.color}22`,
          color: log.activityType.color,
        }}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-sm text-foreground">
            {log.activityType.label}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {SHIFT_HOURS_LABEL[shift]} ·{" "}
            {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {log.project ? (
          <p className="mt-0.5 truncate text-[11px] text-cyan-400/90">
            {log.project.projectCode} · {log.project.name}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function TeamSupervisionUserRow({
  row,
  expanded = false,
  onToggle,
  loading = false,
}: Props) {
  if (loading || !row) {
    return (
      <div className="overflow-hidden rounded-2xl bg-foreground/5 animate-pulse">
        <div className="flex w-full items-center gap-3 px-3.5 py-3">
          <div className="size-9 shrink-0 rounded-full bg-foreground/10" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-foreground/12" />
            <div className="h-3 w-40 rounded bg-foreground/10" />
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="size-1.5 rounded-full bg-foreground/12" />
            ))}
          </div>
          <div className="size-4 shrink-0 rounded bg-foreground/10" />
        </div>
      </div>
    )
  }

  const { user, status, total, manual, auto, lastLoggedAt, shiftsFilled } =
    row
  const meta = STATUS_META[status]

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-foreground/5 transition-colors",
        expanded && "bg-foreground/5.5",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-foreground/5"
      >
        <UserAvatar name={user.name} color={user.color} icon={user.icon} />

        {/* Nombre + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {user.name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                meta.className,
              )}
            >
              {meta.label}
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {total > 0 ? (
              <span className="tabular-nums">
                {total} {total === 1 ? "entrada" : "entradas"}
                {" · "}
                {manual}m / {auto}a
              </span>
            ) : (
              <span>Sin actividad</span>
            )}
            {lastLoggedAt ? (
              <span className="tabular-nums text-muted-foreground/80">
                · Última{" "}
                {new Date(lastLoggedAt).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
          </div>
        </div>

        {/* Dots de turno */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {SHIFT_GROUPS.flatMap(g => g.slots).map(slot => {
            const filled = shiftsFilled.includes(slot.shift)
            return (
              <span
                key={slot.shift}
                title={slot.hours}
                className={cn(
                  "size-1.5 rounded-full",
                  filled ? "bg-cyan-400" : "bg-foreground/12",
                )}
              />
            )
          })}
        </div>

        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-muted-foreground/80 transition-transform",
            expanded && "rotate-180 text-muted-foreground",
          )}
        />
      </button>

      {expanded ? (
        <div className="space-y-1.5 px-3.5 pb-3">
          {row.logs.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground/80">
              Sin entradas en este periodo
            </p>
          ) : (
            row.logs.map(log => <MiniLog key={log.id} log={log} />)
          )}
        </div>
      ) : null}
    </div>
  )
}

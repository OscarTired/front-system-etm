"use client"

import { ChevronDown } from "lucide-react"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
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
  row: TeamUserCompliance
  expanded: boolean
  onToggle: () => void
}

const STATUS_LABEL: Record<TeamUserCompliance["status"], string> = {
  ok: "OK",
  partial: "Parcial",
  missing: "Sin registro",
}

function MiniLog({ log }: { log: ActivityLog }) {
  const Icon = getActivityIcon(log.activityType.icon)
  const shift = log.shift ?? getCurrentShift(new Date(log.loggedAt))

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/3 px-3 py-2.5">
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
          <span className="text-sm text-neutral-200">
            {log.activityType.label}
          </span>
          <span className="text-[11px] text-neutral-500 tabular-nums">
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

export function TeamSupervisionUserRow({ row, expanded, onToggle }: Props) {
  const { user, status, total, manual, auto, lastLoggedAt, shiftsFilled } =
    row

  return (
    <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/4"
      >
        <DynamicBadge
          label={user.name}
          color={user.color}
          icon={user.icon}
          width="field"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                status === "ok" && "bg-emerald-500/15 text-emerald-400",
                status === "partial" && "bg-amber-500/15 text-amber-400",
                status === "missing" && "bg-rose-500/15 text-rose-400",
              )}
            >
              {STATUS_LABEL[status]}
            </span>
            <span className="text-xs text-neutral-400 tabular-nums">
              {total} {total === 1 ? "entrada" : "entradas"}
              {total > 0 ? ` · ${manual}m / ${auto}a` : null}
            </span>
          </div>

          {lastLoggedAt ? (
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Última{" "}
              {new Date(lastLoggedAt).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-neutral-600">Sin actividad</p>
          )}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          {SHIFT_GROUPS.flatMap(g => g.slots).map(slot => {
            const filled = shiftsFilled.includes(slot.shift)
            return (
              <span
                key={slot.shift}
                title={slot.hours}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  filled ? "bg-cyan-400" : "bg-white/15",
                )}
              />
            )
          })}
        </div>

        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-neutral-500 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className="space-y-2 border-t border-white/6 px-3 py-3">
          {row.logs.length === 0 ? (
            <p className="py-2 text-center text-xs text-neutral-600">
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

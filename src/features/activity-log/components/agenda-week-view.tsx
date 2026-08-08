"use client"

import { useMemo } from "react"

import { SHIFT_GROUPS } from "../constants/shift-definitions"
import { logsForDayAndShift } from "../selectors/group-logs-by-shift"
import { getWeekDays } from "../utils/week-range"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import type { ActivityLog } from "../types/activity-log.types"
import { ActivityLogChip } from "./activity-log-chip"
import { cn } from "@/shared/utils/utils"

type Props = {
  anchorDate: Date
  logs: ActivityLog[]
  loading?: boolean
  onSelectDay?: (date: Date) => void
  onLogClick?: (log: ActivityLog) => void
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function AgendaWeekView({
  anchorDate,
  logs,
  loading,
  onSelectDay,
  onLogClick,
}: Props) {
  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const todayISO = toISODateString(new Date())
  const anchorISO = toISODateString(anchorDate)

  const slots = useMemo(
    () =>
      SHIFT_GROUPS.flatMap(g =>
        g.slots.map(slot => ({
          ...slot,
          groupLabel: g.label,
        })),
      ),
    [],
  )

  if (loading) {
    return (
      <div className="min-h-0 flex-1 animate-pulse rounded-2xl bg-white/3" />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white/2">
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className="grid h-full min-h-[calc(100vh-14rem)] min-w-[720px]"
          style={{
            gridTemplateColumns: "7.5rem repeat(7, minmax(0, 1fr))",
            gridTemplateRows: `auto repeat(${slots.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Header vacío esquina */}
          <div className="sticky left-0 top-0 z-20 border-b border-white/6 bg-[#0a0a0b] p-2" />

          {/* Días */}
          {days.map((day, i) => {
            const iso = toISODateString(day)
            const isToday = iso === todayISO
            const isAnchor = iso === anchorISO

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDay?.(day)}
                className={cn(
                  "sticky top-0 z-10 border-b border-l border-white/6 bg-[#0a0a0b] px-2 py-2.5 text-center transition-colors hover:bg-white/4",
                  isToday && "bg-white/4",
                  isAnchor && "ring-1 ring-inset ring-white/15",
                )}
              >
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  {WEEKDAY_LABELS[i]}
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-sm font-semibold",
                    isToday ? "text-cyan-400" : "text-neutral-200",
                  )}
                >
                  {day.getDate()}
                </div>
              </button>
            )
          })}

          {/* Filas de franja — reparten el alto restante */}
          {slots.map(slot => (
            <div key={slot.shift} className="contents">
              <div className="sticky left-0 z-10 flex flex-col justify-center gap-0.5 border-b border-white/6 bg-[#0a0a0b] px-2 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {slot.groupLabel}
                </span>
                <span className="text-[11px] text-neutral-400">{slot.hours}</span>
              </div>

              {days.map(day => {
                const iso = toISODateString(day)
                const cellLogs = logsForDayAndShift(logs, iso, slot.shift)

                return (
                  <div
                    key={`${slot.shift}-${iso}`}
                    className={cn(
                      "min-h-0 border-b border-l border-white/6 p-1",
                      iso === todayISO && "bg-white/[0.02]",
                    )}
                  >
                    <div className="flex h-full flex-col gap-1 overflow-y-auto">
                      {cellLogs.map(log => (
                        <ActivityLogChip
                          key={log.id}
                          log={log}
                          compact
                          onClick={
                            onLogClick
                              ? () => onLogClick(log)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

import { useMemo } from "react"

import { SHIFT_GROUPS } from "../../constants/shift-definitions"
import { logsForDayAndShift } from "../../selectors/group-logs-by-shift"
import { getWeekDays } from "../../utils/week-range"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import type { ActivityLog } from "../../types/activity-log.types"
import { ActivityLogChip } from "../actions/activity-log-chip"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

type Props = {
  anchorDate: Date
  logs: ActivityLog[]
  loading?: boolean
  onSelectDay?: (date: Date) => void
  onLogClick?: (log: ActivityLog) => void
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const DISTINCT_SHIFT_COLORS = [
  "text-amber-400",
  "text-emerald-400",
  "text-rose-400",
  "text-violet-400",
  "text-teal-400",
  "text-fuchsia-400",
]

/**
 * Layout decidido por isCompact (phone landscape incluido).
 * Loading = mismos ActivityLogChip con loading; sin árboles skeleton.
 */
export function AgendaWeekView({
  anchorDate,
  logs,
  loading,
  onSelectDay,
  onLogClick,
}: Props) {
  const { isCompact } = useResponsive()
  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const todayISO = toISODateString(new Date())
  const anchorISO = toISODateString(anchorDate)

  if (isCompact) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border-0 bg-[#0c0c0e]">
        <div
          className={cn(
            "flex shrink-0 gap-1 overflow-x-auto border-0 px-2 py-2.5",
            "[-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden",
          )}
        >
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
                  "flex min-w-[2.85rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 transition-colors",
                  isAnchor && "bg-white/10",
                  isToday && !isAnchor && "bg-amber-500/10",
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    isToday ? "text-amber-400" : "text-neutral-500",
                  )}
                >
                  {WEEKDAY_LABELS[i]}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                    isToday &&
                      "bg-amber-400 text-neutral-950 shadow-[0_0_10px_rgba(251,191,36,0.35)]",
                    !isToday && isAnchor && "bg-white/15 text-white",
                    !isToday && !isAnchor && "text-neutral-300",
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            )
          })}
        </div>

        <ScrollArea className="h-full min-h-0 min-w-0 w-full flex-1">
        <div className="flex min-w-0 w-full flex-col divide-y divide-white/5">
          {SHIFT_GROUPS.map((group, index) => {
            const GroupIcon = group.icon
            const iconColorClass =
              DISTINCT_SHIFT_COLORS[index % DISTINCT_SHIFT_COLORS.length]
            const dayLogs = group.slots.flatMap(slot =>
              logsForDayAndShift(logs, anchorISO, slot.shift),
            )

            return (
              <section
                key={group.key}
                className="flex min-h-0 flex-1 flex-col justify-center px-3 py-3.5"
              >
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <GroupIcon
                    size={14}
                    strokeWidth={2.5}
                    className={iconColorClass}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {group.label}
                  </span>
                  <span className="text-[10px] tabular-nums text-neutral-500">
                    {group.slots.map(s => s.hours).join(" · ")}
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-1.5">
                    <ActivityLogChip loading className="w-full border-0 shadow-none" />
                    <ActivityLogChip loading className="w-full border-0 shadow-none" />
                  </div>
                ) : dayLogs.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {dayLogs.map(log => (
                      <ActivityLogChip
                        key={log.id}
                        log={log}
                        onClick={
                          onLogClick ? () => onLogClick(log) : undefined
                        }
                        className="w-full border-0 shadow-none outline-none ring-0"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-0.5 text-[11px] text-neutral-600">
                    Sin registros
                  </p>
                )}
              </section>
            )
          })}
        </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl">
      <ScrollArea className="h-full min-h-0 min-w-0 w-full flex-1">
        <div
          className="grid h-full min-h-full w-full bg-[#0c0c0e]"
          style={{
            gridTemplateColumns: "11rem repeat(7, minmax(0, 1fr))",
            gridTemplateRows: `auto repeat(${SHIFT_GROUPS.length}, minmax(5.5rem, 1fr))`,
          }}
        >
          <div className="sticky left-0 top-0 z-30 flex items-center justify-center border-b border-white/5 bg-[#0c0c0e] p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Turnos / Días
            </span>
          </div>

          {days.map((day, i) => {
            const iso = toISODateString(day)
            const isToday = iso === todayISO
            const isAnchor = iso === anchorISO
            const isWeekend = i >= 5

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDay?.(day)}
                className={cn(
                  "sticky top-0 z-20 border-b border-white/5 bg-[#0c0c0e] px-3 py-3 text-center transition-colors duration-200",
                  "hover:bg-white/5",
                  isWeekend && "bg-white/2",
                  isToday && "bg-amber-500/10",
                  isAnchor && !isToday && "bg-white/6",
                )}
              >
                <div
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    isToday ? "text-amber-400" : "text-neutral-400",
                  )}
                >
                  {WEEKDAY_LABELS[i]}
                </div>
                <div className="mt-1.5 flex justify-center">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold tabular-nums transition-all duration-200",
                      isToday &&
                        "bg-amber-400 text-neutral-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]",
                      !isToday &&
                        isAnchor &&
                        "bg-white/20 text-white shadow-sm",
                      !isToday &&
                        !isAnchor &&
                        "text-neutral-300 hover:text-white",
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
              </button>
            )
          })}

          {SHIFT_GROUPS.map((group, index) => {
            const GroupIcon = group.icon
            const iconColorClass =
              DISTINCT_SHIFT_COLORS[index % DISTINCT_SHIFT_COLORS.length]
            const isLast = index === SHIFT_GROUPS.length - 1

            return (
              <div key={group.key} className="contents">
                <div
                  className={cn(
                    "sticky left-0 z-10 flex flex-col justify-center bg-[#0c0c0e] px-3.5 py-3",
                    !isLast && "border-b border-white/5",
                  )}
                >
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex items-center justify-center gap-2 text-neutral-300">
                      <GroupIcon
                        size={14}
                        strokeWidth={2.5}
                        className={cn("shrink-0", iconColorClass)}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.slots.map(slot => (
                        <span
                          key={slot.shift}
                          className="text-[11px] font-medium tabular-nums text-neutral-400"
                        >
                          {slot.hours}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {days.map((day, dayIndex) => {
                  const iso = toISODateString(day)
                  const cellLogs = group.slots.flatMap(slot =>
                    logsForDayAndShift(logs, iso, slot.shift),
                  )
                  const isToday = iso === todayISO
                  const isWeekend = dayIndex >= 5
                  const empty = !loading && cellLogs.length === 0

                  return (
                    <div
                      key={`${group.key}-${iso}`}
                      className={cn(
                        "flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#0c0c0e] p-2 transition-colors duration-150",
                        empty ? "justify-center" : "justify-start",
                        !isLast && "border-b border-white/5",
                        isWeekend && "bg-white/2",
                        isToday && "bg-amber-500/4",
                      )}
                    >
                      {loading ? (
                        <div className="flex min-h-0 flex-col gap-1.5">
                          <ActivityLogChip
                            loading
                            compact
                            className="w-full shrink-0 border-0 shadow-none"
                          />
                          {dayIndex % 2 === 0 && (
                            <ActivityLogChip
                              loading
                              compact
                              className="w-full shrink-0 border-0 shadow-none"
                            />
                          )}
                        </div>
                      ) : cellLogs.length === 0 ? (
                        <div className="flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                        </div>
                      ) : (
                        <div className="flex min-h-0 flex-col gap-1.5">
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
                              className="w-full shrink-0 border-0 shadow-none outline-none ring-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

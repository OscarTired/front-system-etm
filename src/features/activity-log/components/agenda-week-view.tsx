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

// Colores únicos y diferenciados para cada turno (evitando que todos sean cyan/azules)
const DISTINCT_SHIFT_COLORS = [
  "text-amber-400",   // Mañana / Dorado cálido
  "text-emerald-400", // Almuerzo / Verde fresco
  "text-rose-400",    // Tarde / Coral vibrante
  "text-violet-400",  // Noche / Violeta profundo
  "text-teal-400",    // Extra 1
  "text-fuchsia-400", // Extra 2
]

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

  if (loading) {
    return (
      <div className="flex h-full min-h-100 flex-1 flex-col overflow-hidden rounded-2xl bg-white/2 shadow-2xl">
        <div className="flex-1 animate-pulse bg-linear-to-b from-white/6 via-white/2 to-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-100 flex-1 flex-col overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl">
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div
          className="grid h-full min-w-210 bg-[#0c0c0e]"
          style={{
            gridTemplateColumns: "11rem repeat(7, minmax(0, 1fr))",
            gridTemplateRows: `auto repeat(${SHIFT_GROUPS.length}, minmax(auto, 1fr))`,
          }}
        >
          {/* Esquina superior izquierda */}
          <div className="sticky left-0 top-0 z-30 border-b border-r border-white/5 bg-[#0c0c0e] p-3 flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Turnos / Días
            </span>
          </div>

          {/* Cabeceras de los días */}
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
                  "sticky top-0 z-20 border-b border-l border-white/5 bg-[#0c0c0e] px-3 py-3 text-center transition-colors duration-200",
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
                      !isToday && isAnchor && "bg-white/20 text-white shadow-sm",
                      !isToday && !isAnchor && "text-neutral-300 hover:text-white",
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
              </button>
            )
          })}

          {/* Filas basadas en SHIFT_GROUPS */}
          {SHIFT_GROUPS.map((group, index) => {
            const GroupIcon = group.icon
            // Asigna un color distinto y único por cada índice de grupo
            const iconColorClass = DISTINCT_SHIFT_COLORS[index % DISTINCT_SHIFT_COLORS.length]

            return (
              <div key={group.key} className="contents">
                {/* Columna lateral del grupo */}
                <div className="sticky left-0 z-10 flex flex-col justify-center gap-1.5 border-b border-r border-white/5 bg-[#0c0c0e] px-3.5 py-3">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <GroupIcon size={14} strokeWidth={2.5} className={cn("shrink-0", iconColorClass)} />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {group.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 pl-5">
                    {group.slots.map((slot) => (
                      <span key={slot.shift} className="text-[11px] font-medium tabular-nums text-neutral-400">
                        {slot.hours}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Celdas de los días para este grupo */}
                {days.map((day, dayIndex) => {
                  const iso = toISODateString(day)
                  const cellLogs = group.slots.flatMap((slot) =>
                    logsForDayAndShift(logs, iso, slot.shift)
                  )
                  const isToday = iso === todayISO
                  const isAnchor = iso === anchorISO
                  const isWeekend = dayIndex >= 5

                  return (
                    <div
                      key={`${group.key}-${iso}`}
                      className={cn(
                        "min-h-0 border-b border-l border-white/5 p-2 bg-[#0c0c0e] transition-colors duration-150",
                        isWeekend && "bg-white/2",
                        isToday && "bg-amber-500/2",
                      )}
                    >
                      <div className="flex h-full min-h-0 flex-col gap-1.5">
                        {cellLogs.length === 0 ? (
                          <div className="flex h-full min-h-14 items-center justify-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                          </div>
                        ) : (
                          cellLogs.map((log) => (
                            <ActivityLogChip
                              key={log.id}
                              log={log}
                              onClick={
                                onLogClick ? () => onLogClick(log) : undefined
                              }
                              className="w-full shrink-0 border-0 outline-none ring-0 shadow-none transition-transform hover:scale-[1.02]"
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
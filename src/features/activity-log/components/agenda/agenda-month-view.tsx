"use client"

import { useMemo } from "react"

import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { getActivityIcon } from "../../constants/activity-icons"
import type { ActivityLog } from "../../types/activity-log.types"
import { getMonthGrid } from "../../utils/week-range"
import { AgendaMonthSkeleton } from "./agenda-month-skeleton"

type Props = {
  anchorDate: Date
  logs: ActivityLog[]
  loading?: boolean
  onSelectDay?: (date: Date) => void
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MAX_EVENTS_DESKTOP = 3
const MAX_DOTS_MOBILE = 4

function groupLogsByDay(logs: ActivityLog[]): Map<string, ActivityLog[]> {
  const map = new Map<string, ActivityLog[]>()
  for (const log of logs) {
    const key = toISODateString(new Date(log.loggedAt))
    const list = map.get(key)
    if (list) list.push(log)
    else map.set(key, [log])
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
    )
  }
  return map
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MonthEventCard({ log }: { log: ActivityLog }) {
  const Icon = getActivityIcon(log.activityType.icon)
  const color = log.activityType.color
  const subtitle = log.project
    ? `${log.project.projectCode} · ${log.project.name}`
    : log.note ?? null

  return (
    <div
      className="flex min-w-0 items-start gap-1.5 rounded-md px-1.5 py-1"
      style={{ backgroundColor: `${color}18` }}
      title={`${formatTime(log.loggedAt)} ${log.activityType.label}${
        subtitle ? ` — ${subtitle}` : ""
      }`}
    >
      <div
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}33`, color }}
      >
        <Icon size={10} />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[10px] font-semibold text-neutral-200">
          <span className="text-neutral-400">{formatTime(log.loggedAt)}</span>{" "}
          {log.activityType.label}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[9px] text-neutral-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

function MobileDayDots({ logs }: { logs: ActivityLog[] }) {
  const visible = logs.slice(0, MAX_DOTS_MOBILE)
  const extra = logs.length - visible.length

  return (
    <div className="mt-0.5 flex flex-wrap items-center justify-center gap-0.5">
      {visible.map(log => (
        <span
          key={log.id}
          className="size-1.5 rounded-full"
          style={{ backgroundColor: log.activityType.color }}
          title={log.activityType.label}
        />
      ))}
      {extra > 0 && (
        <span className="text-[9px] font-semibold leading-none text-neutral-500">
          +{extra}
        </span>
      )}
    </div>
  )
}

export function AgendaMonthView({
  anchorDate,
  logs,
  loading,
  onSelectDay,
}: Props) {
  const { isMobile } = useResponsive()
  const cells = useMemo(() => getMonthGrid(anchorDate), [anchorDate])
  const byDay = useMemo(() => groupLogsByDay(logs), [logs])

  const todayISO = toISODateString(new Date())
  const anchorISO = toISODateString(anchorDate)
  const viewMonth = anchorDate.getMonth()
  const viewYear = anchorDate.getFullYear()

  if (loading) {
    return <AgendaMonthSkeleton />
  }

  return (
    // h-full + min-h-0: el padre (flex-1) define el alto; este lo llena
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-[#0c0c0e] shadow-2xl backdrop-blur-xl">
      {/* Cabecera fija */}
      <div className="grid shrink-0 grid-cols-7 border-b border-white/5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-center py-2",
              i >= 5 && "bg-white/2",
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 tablet:text-[11px]">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/*
        Cuerpo: flex-1 + min-h-0 para tomar el alto restante.
        grid-rows-6 con 1fr implícito → cada semana se reparte el espacio.
      */}
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 6 }).map((_, week) => (
          <div
            key={week}
            className="grid min-h-0 border-b border-white/5 last:border-b-0"
            style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {cells.slice(week * 7, week * 7 + 7).map((day, dayIndex) => {
              const iso = toISODateString(day)
              const inMonth =
                day.getMonth() === viewMonth &&
                day.getFullYear() === viewYear
              const isToday = iso === todayISO
              const isAnchor = iso === anchorISO
              const isWeekend = dayIndex >= 5
              const isFuture = day.getTime() > Date.now()
              const dayLogs = byDay.get(iso) ?? []
              const hasLogs = dayLogs.length > 0

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isFuture}
                  onClick={() => onSelectDay?.(day)}
                  className={cn(
                    "relative flex min-h-0 flex-col overflow-hidden border-r border-white/5 text-left transition-colors last:border-r-0",
                    isMobile
                      ? "items-center justify-start gap-0.5 p-1"
                      : "items-stretch gap-1 p-1.5",
                    isWeekend && "bg-white/1.5",
                    !inMonth && "opacity-35",
                    isAnchor && "bg-white/4",
                    isToday && "bg-amber-500/10",
                    !isFuture && "hover:bg-white/6",
                    isFuture && "cursor-default opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full font-semibold",
                      isMobile ? "size-7 text-xs" : "size-6 text-[11px]",
                      isToday
                        ? "bg-amber-400 text-black"
                        : isAnchor
                          ? "bg-white/12 text-white"
                          : hasLogs
                            ? "text-neutral-200"
                            : "text-neutral-500",
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {isMobile && hasLogs && <MobileDayDots logs={dayLogs} />}

                  {!isMobile && hasLogs && (
                    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                      {dayLogs.slice(0, MAX_EVENTS_DESKTOP).map(log => (
                        <MonthEventCard key={log.id} log={log} />
                      ))}
                      {dayLogs.length > MAX_EVENTS_DESKTOP && (
                        <span className="px-1 pt-0.5 text-center text-[10px] font-medium text-neutral-500">
                          +{dayLogs.length - MAX_EVENTS_DESKTOP} más
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
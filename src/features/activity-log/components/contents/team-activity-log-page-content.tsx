"use client"

import { useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"

import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"

import { useCallback, useMemo, useState } from "react"

import { UserSelect } from "@/features/users/components/user-select"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"

import { DateNavigator } from "@/shared/ui/date-picker/components/date-navigator"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { getActivityIcon } from "../../constants/activity-icons"
import {
  SHIFT_GROUPS,
  SHIFT_HOURS_LABEL,
  getCurrentShift,
} from "../../constants/shift-definitions"
import { useTeamActivityLog } from "../../hooks/use-team-activity-log"
import { useActivityLogMarkedDates } from "../../hooks/use-activity-log-marked-dates"
import { useTeamBitacoraViewStore } from "../../store/team-bitacora-view-store"
import { TeamBitacoraViewToggle } from "../toggles/team-bitacora-view-toggle"
import { TeamSupervisionView } from "../supervision/team-supervision-view"
import { AgendaMonthView } from "../agenda/agenda-month-view"
import { getMonthRangeISO } from "../../utils/week-range"

function startOfDayISO(date: string) {
  return new Date(`${date}T00:00:00`).toISOString()
}

function endOfDayISO(date: string) {
  return new Date(`${date}T23:59:59`).toISOString()
}

type Log = ReturnType<typeof useTeamActivityLog>["logs"][number]

function groupLogsByShift(logs: Log[]) {
  const buckets: {
    key: string
    label: string
    icon: (typeof SHIFT_GROUPS)[number]["icon"]
    logs: Log[]
  }[] = []

  for (const group of SHIFT_GROUPS) {
    const shiftsInGroup = new Set(group.slots.map(slot => slot.shift))

    const matched = logs.filter(log => {
      const effectiveShift =
        log.shift ?? getCurrentShift(new Date(log.loggedAt))
      return shiftsInGroup.has(effectiveShift)
    })

    if (matched.length > 0) {
      buckets.push({
        key: group.key,
        label: group.label,
        icon: group.icon,
        logs: matched,
      })
    }
  }

  return buckets
}

function ActivityLogCard({
  log,
  loading = false,
}: {
  log?: Log
  loading?: boolean
}) {
  if (loading || !log) {
    return (
      <div className="w-full rounded-2xl bg-foreground/5 p-4 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="size-10 shrink-0 rounded-full bg-foreground/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-28 rounded bg-foreground/12" />
              <div className="h-3 w-24 rounded bg-foreground/10" />
            </div>
            <div className="h-3.5 w-36 rounded bg-foreground/10" />
            <div className="h-3 w-48 rounded bg-foreground/10" />
          </div>
        </div>
      </div>
    )
  }

  const Icon = getActivityIcon(log.activityType.icon)
  const effectiveShift =
    log.shift ?? getCurrentShift(new Date(log.loggedAt))

  return (
    <div className="w-full rounded-2xl bg-foreground/5 p-4 transition-colors hover:bg-foreground/5">
      <div className="flex items-start gap-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${log.activityType.color}22`,
            color: log.activityType.color,
          }}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">
              {log.user?.name ?? "—"}
            </span>

            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {SHIFT_HOURS_LABEL[effectiveShift]}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {log.activityType.label}
          </p>

          {log.project && (
            <p className="mt-2 text-xs text-primary">
              {log.project.projectCode} · {log.project.name}
              {log.task &&
                ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
            </p>
          )}

          {log.note && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {log.note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ShiftBucketedLogs({ logs }: { logs: Log[] }) {
  const buckets = groupLogsByShift(logs)

  return (
    <div className="flex w-full flex-col gap-4">
      {buckets.map(bucket => {
        const BucketIcon = bucket.icon

        return (
          <div key={bucket.key} className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <BucketIcon size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {bucket.label}
              </span>
            </div>

            <div className="flex w-full flex-col gap-3">
              {bucket.logs.map(log => (
                <ActivityLogCard key={log.id} log={log} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EntryCountBadge({
  count,
  compact = false,
}: {
  count: number
  compact?: boolean
}) {
  if (compact) {
    return (
      <div
        className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 px-2 text-xs font-semibold tabular-nums text-muted-foreground"
        title={`${count} ${count === 1 ? "entrada" : "entradas"}`}
      >
        {count}
      </div>
    )
  }

  return (
    <div className="flex h-9 min-w-32 items-center justify-center rounded-xl bg-foreground/5 px-3 text-sm font-medium text-muted-foreground">
      {count} {count === 1 ? "entrada" : "entradas"}
    </div>
  )
}

export function TeamActivityLogPageContent({ embedded = false }: { embedded?: boolean } = {}) {
  const queryClient = useQueryClient()

  usePageTitle("Bitácora de Equipo", { mobile: "Bitácora" })

  const { users } = useUsersDirectory()

  const [selectedUser, setSelectedUser] = useState<User>()
  const [date, setDate] = useState<Date | null>(new Date())
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date())

  const viewMode = useTeamBitacoraViewStore(s => s.viewMode)
  const setViewMode = useTeamBitacoraViewStore(s => s.setViewMode)
  const isSupervision = viewMode === "supervision"
  const isMonth = viewMode === "month"

  const monthRange = useMemo(
    () => getMonthRangeISO(viewMonth),
    [viewMonth],
  )

  const filters = useMemo(() => {
    if (isMonth) {
      return {
        userId: selectedUser?.id,
        from: startOfDayISO(monthRange.from),
        to: endOfDayISO(monthRange.to),
      }
    }
    return {
      userId: selectedUser?.id,
      from: date ? startOfDayISO(toISODateString(date)) : undefined,
      to: date ? endOfDayISO(toISODateString(date)) : undefined,
    }
  }, [selectedUser, date, isMonth, monthRange])

  // Supervisión: todos los logs del día (sin filtrar por usuario del toolbar).
  const supervisionFilters = useMemo(
    () => ({
      from: date ? startOfDayISO(toISODateString(date)) : undefined,
      to: date ? endOfDayISO(toISODateString(date)) : undefined,
    }),
    [date],
  )

  const { logs, loading } = useTeamActivityLog(
    isSupervision ? supervisionFilters : filters,
  )

  const { markedDates } = useActivityLogMarkedDates({
    scope: "team",
    userId: selectedUser?.id,
    month: viewMonth,
  })

  const handleDateChange = useCallback((next: Date | null) => {
    const d = next ?? new Date()
    setDate(d)
    setViewMonth(d)
  }, [])

  const handleViewMonthChange = useCallback((month: Date) => {
    setViewMonth(month)
  }, [])

  const isToday = (() => {
    if (!date) return false
    const now = new Date()
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  })()

  function goToToday() {
    const today = new Date()
    setDate(today)
    setViewMonth(today)
  }

  const groupedLogs = useMemo(() => {
    if (selectedUser) return []

    const groups = new Map<
      string,
      { user: User | null; logs: typeof logs }
    >()

    for (const log of logs) {
      const key = log.user?.id ?? "unknown"
      const existing = groups.get(key)

      if (existing) {
        existing.logs.push(log)
        continue
      }

      groups.set(key, {
        user: (log.user as User) ?? null,
        logs: [log],
      })
    }

    return [...groups.values()]
  }, [logs, selectedUser])

  const handleUserChange = (user?: User) => {
    if (selectedUser?.id === user?.id) {
      setSelectedUser(undefined)
    } else {
      setSelectedUser(user)
    }
  }

  /** Sale de la vista filtrada por persona (día del usuario → equipo). */
  const clearSelectedUser = () => {
    setSelectedUser(undefined)
  }

  const toolbar = (
    <div className="w-full shrink-0 rounded-2xl bg-surface p-2 tablet:p-4">
      <div className="flex flex-col gap-2 tablet:hidden">
        <UserSelect
          value={selectedUser}
          items={users as User[]}
          placeholder="Todo el equipo"
          onChange={handleUserChange}
        />

        {selectedUser && !isMonth && !isSupervision && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-foreground/5 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Vista del usuario
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedUser.name}
              </p>
            </div>
            <button
              type="button"
              aria-label="Salir de la vista del usuario"
              onClick={clearSelectedUser}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground transition hover:bg-foreground/15 active:scale-95"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div className="flex shrink-0 items-center gap-1">
            <TeamBitacoraViewToggle compact />
            <button
              type="button"
              onClick={goToToday}
              disabled={isToday}
              className={
                isToday
                  ? "flex h-8 shrink-0 items-center rounded-lg px-2.5 text-xs font-semibold cursor-default bg-amber-500/25 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400/50"
                  : "flex h-8 shrink-0 items-center rounded-lg px-2.5 text-xs font-semibold bg-amber-500/25 text-amber-800 hover:bg-amber-500/35 hover:text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-200"
              }
            >
              Hoy
            </button>
          </div>

          <div className="min-w-0 flex-1 flex justify-center">
            <DateNavigator
              value={date}
              onChange={handleDateChange}
              placeholder="Fecha"
              maxDate={new Date()}
              markedDates={markedDates}
              onViewMonthChange={handleViewMonthChange}
              iconOnly
            />
          </div>

          <EntryCountBadge count={logs.length} compact />
        </div>
      </div>

      <div className="hidden tablet:grid tablet:grid-cols-[1fr_auto_1fr] tablet:items-center tablet:gap-4">
        {/* Mismo orden que Prod/Ing: vista | fecha | filtro + contador */}
        <div className="flex items-center gap-2 justify-self-start">
          <TeamBitacoraViewToggle />
          <button
            type="button"
            onClick={goToToday}
            disabled={isToday}
            className={
              isToday
                ? "flex h-8 items-center rounded-xl px-3.5 text-sm font-semibold cursor-default bg-amber-500/25 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400/50"
                : "flex h-8 items-center rounded-xl px-3.5 text-sm font-semibold bg-amber-500/25 text-amber-800 hover:bg-amber-500/35 hover:text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-200"
            }
          >
            Hoy
          </button>
        </div>

        <div className="justify-self-center">
          <DateNavigator
            value={date}
            onChange={handleDateChange}
            placeholder="Fecha"
            maxDate={new Date()}
            markedDates={markedDates}
            onViewMonthChange={handleViewMonthChange}
          />
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <div className="w-56">
            <UserSelect
              value={selectedUser}
              items={users as User[]}
              placeholder="Todo el equipo"
              onChange={handleUserChange}
            />

            {selectedUser && !isMonth && !isSupervision && (
              <button
                type="button"
                aria-label="Salir de la vista del usuario"
                onClick={clearSelectedUser}
                title={`Salir de ${selectedUser.name}`}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-foreground/5 px-3 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
              >
                <span className="max-w-[10rem] truncate">{selectedUser.name}</span>
                <X size={14} strokeWidth={2.4} />
              </button>
            )}
          </div>
          <EntryCountBadge count={logs.length} />
        </div>
      </div>
    </div>
  )

  const body = (
    <>
        <div className="mb-1">{toolbar}</div>

        {isSupervision ? (
          <TeamSupervisionView
            users={users as User[]}
            logs={logs}
            loading={loading}
            focusUserId={selectedUser?.id}
          />
        ) : isMonth ? (
          <div className="flex min-h-[28rem] w-full flex-1 flex-col pb-4">
            <AgendaMonthView
              anchorDate={viewMonth}
              logs={logs}
              loading={loading}
              onSelectDay={day => {
                setDate(day)
                setViewMonth(day)
                setViewMode("day")
              }}
            />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-6 pb-4">
            {loading ? (
              <div className="flex w-full flex-col gap-8">
                {Array.from({ length: 2 }).map((_, s) => (
                  <section key={s} className="flex w-full flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 animate-pulse">
                      <div className="h-8 w-36 rounded-lg bg-foreground/10" />
                      <div className="h-6 w-20 rounded-lg bg-foreground/10" />
                    </div>
                    <div className="flex w-full flex-col gap-3">
                      <ActivityLogCard loading />
                      <ActivityLogCard loading />
                    </div>
                  </section>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-foreground/5 text-sm text-muted-foreground">
                Sin entradas para este filtro
              </div>
            ) : selectedUser ? (
              <ShiftBucketedLogs logs={logs} />
            ) : (
              <div className="flex w-full flex-col gap-8">
                {groupedLogs.map(group => (
                  <section
                    key={group.user?.id ?? "unknown"}
                    className="flex w-full flex-col gap-3"
                  >
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <DynamicBadge
                          label={group.user?.name ?? "Sin usuario"}
                          color={group.user?.color ?? "#71717A"}
                          icon={group.user?.icon}
                          width="field"
                        />
                      </div>

                      <div className="rounded-lg bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {group.logs.length}{" "}
                        {group.logs.length === 1 ? "actividad" : "actividades"}
                      </div>
                    </div>

                    <ShiftBucketedLogs logs={group.logs} />
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
    </>
  )

  // embedded: crecer con el contenido (scroll del hub). Sin overflow-hidden.
  // standalone: este hijo es dueño del scroll.
  if (embedded) {
    return <div className="w-full">{body}</div>
  }
  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <AppListScroll
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["activity-log"] })
        }}
      >{body}</AppListScroll>
    </div>
  )
}
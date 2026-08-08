"use client"

import { useCallback, useMemo, useState } from "react"

import { UserSelect } from "@/features/users/components/user-select"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"

import { DateNavigator } from "@/shared/ui/date-picker/components/date-navigator"
import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { getActivityIcon } from "../../constants/activity-icons"
import { SHIFT_GROUPS, SHIFT_HOURS_LABEL, getCurrentShift } from "../../constants/shift-definitions"
import { useTeamActivityLog } from "../../hooks/use-team-activity-log"
import { useActivityLogMarkedDates } from "../../hooks/use-activity-log-marked-dates"
import { TeamActivityLogSkeleton } from "../skeletons/team-activity-log-skeleton"

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

      const effectiveShift = log.shift ?? getCurrentShift(new Date(log.loggedAt))

      return shiftsInGroup.has(effectiveShift)

    })

    if (matched.length > 0) {
      buckets.push({ key: group.key, label: group.label, icon: group.icon, logs: matched })
    }

  }

  return buckets

}

type ActivityCardProps = {
  log: Log
}

function ActivityLogCard({
  log,
}: ActivityCardProps) {
  const Icon = getActivityIcon(log.activityType.icon)

  // Igual que en groupLogsByShift: los AUTO no tienen `shift`
  // guardado, se deriva de su hora real solo para mostrarlo acá —
  // así el badge se ve igual sea manual o automática.
  const effectiveShift = log.shift ?? getCurrentShift(new Date(log.loggedAt))

  return (
    <div className="rounded-2xl bg-white/3 p-4 transition-colors hover:bg-white/5">
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
            <span className="font-medium text-neutral-100">
              {log.user?.name ?? "—"}
            </span>

            <div className="flex shrink-0 items-center gap-2">

              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                {SHIFT_HOURS_LABEL[effectiveShift]}
              </span>

              <span className="text-xs text-neutral-500">
                {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

            </div>
          </div>

          <p className="mt-1 text-sm text-neutral-300">
            {log.activityType.label}
          </p>

          {log.project && (
            <p className="mt-2 text-xs text-cyan-400">
              {log.project.projectCode} · {log.project.name}
              {log.task &&
                ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
            </p>
          )}

          {log.note && (
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              {log.note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ShiftBucketedLogs({
  logs,
}: {
  logs: Log[]
}) {

  const buckets = groupLogsByShift(logs)

  return (
    <div className="flex flex-col gap-4">
      {buckets.map(bucket => {
        const BucketIcon = bucket.icon

        return (
          <div key={bucket.key} className="flex flex-col gap-2">

            <div className="flex items-center gap-2 px-1">
              <BucketIcon size={13} className="text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {bucket.label}
              </span>
            </div>

            <div className="flex flex-col gap-3">
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

export function TeamActivityLogPageContent() {

  usePageTitle("Bitácora de Equipo")

  const { users } = useUsersDirectory()

  const [selectedUser, setSelectedUser] = useState<User>()
  const [date, setDate] = useState<Date | null>(new Date())
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date())

  const filters = useMemo(
    () => ({
      userId: selectedUser?.id,
      from: date ? startOfDayISO(toISODateString(date)) : undefined,
      to: date ? endOfDayISO(toISODateString(date)) : undefined,
    }),
    [selectedUser, date],
  )

  const { logs, loading } = useTeamActivityLog(filters)

  const { markedDates } = useActivityLogMarkedDates({
    scope: "team",
    month: viewMonth,
    userId: selectedUser?.id,
  })

  const handleViewMonthChange = useCallback((month: Date) => {
    setViewMonth(month)
  }, [])

  const handleDateChange = useCallback((next: Date | null) => {
    setDate(next)
    if (next) setViewMonth(next)
  }, [])

  const groupedLogs = useMemo(() => {
    if (selectedUser) {
      return []
    }

    const groups = new Map<
      string,
      {
        user: User | null
        logs: typeof logs
      }
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="rounded-2xl bg-white/2 p-4">
        {/* Mobile */}
        <div className="flex flex-wrap items-center justify-center gap-3 tablet:hidden">
          <div className="w-56 shrink-0">
            <UserSelect
              value={selectedUser}
              items={users as User[]}
              placeholder="Todo el equipo"
              onChange={handleUserChange}
            />
          </div>

          <DateNavigator
            value={date}
            onChange={handleDateChange}
            placeholder="Fecha"
            maxDate={new Date()}
            markedDates={markedDates}
            onViewMonthChange={handleViewMonthChange}
          />

          <div className="flex h-9 min-w-27.5 items-center justify-center rounded-lg bg-white/5 px-3 text-sm text-neutral-400">
            {logs.length} {logs.length === 1 ? "entrada" : "entradas"}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden tablet:grid tablet:grid-cols-[1fr_auto_1fr] tablet:items-center tablet:gap-4">
          {/* Izquierda */}
          <div className="justify-self-start">
            <div className="w-56">
              <UserSelect
                value={selectedUser}
                items={users as User[]}
                placeholder="Todo el equipo"
                onChange={handleUserChange}
              />
            </div>
          </div>

          {/* Centro */}
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

          {/* Derecha */}
          <div className="justify-self-end">
            <div className="flex h-9 min-w-27.5 items-center justify-center rounded-lg bg-white/5 px-3 text-sm text-neutral-400">
              {logs.length} {logs.length === 1 ? "entrada" : "entradas"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <TeamActivityLogSkeleton />
        ) : logs.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border-white/10 bg-white/2 text-sm text-neutral-500">
            Sin entradas para este filtro
          </div>
        ) : selectedUser ? (
          <ShiftBucketedLogs logs={logs} />
        ) : (
          <div className="flex flex-col gap-8">
            {groupedLogs.map(group => (
              <section
                key={group.user?.id ?? "unknown"}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                  <div className="flex items-center gap-3">
                    <DynamicBadge
                      label={group.user?.name ?? "Sin usuario"}
                      color={group.user?.color ?? "#71717A"}
                      icon={group.user?.icon}
                      width="field"
                    />
                  </div>

                  <div className="rounded-lg bg-white/5 px-3 py-1 text-xs font-medium text-neutral-400">
                    {group.logs.length}{" "}
                    {group.logs.length === 1
                      ? "actividad"
                      : "actividades"}
                  </div>
                </div>

                <ShiftBucketedLogs logs={group.logs} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
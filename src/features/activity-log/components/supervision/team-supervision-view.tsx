"use client"

import { useMemo, useState } from "react"

import type { User } from "@/features/users/types/user.types"
import type { ActivityLog } from "../../types/activity-log.types"
import type { TeamSupervisionStatusFilter } from "../../types/team-supervision.types"
import { buildTeamSupervision } from "../../selectors/build-team-supervision"
import { TeamSupervisionKpiBar } from "./team-supervision-kpi-bar"
import { TeamSupervisionUserRow } from "./team-supervision-user-row"

type Props = {
  users: User[]
  logs: ActivityLog[]
  loading?: boolean
  /** Si hay user filtrado en el toolbar, acota el ranking */
  focusUserId?: string
}

export function TeamSupervisionView({
  users,
  logs,
  loading,
  focusUserId,
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState<TeamSupervisionStatusFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const result = useMemo(
    () => buildTeamSupervision(users, logs),
    [users, logs],
  )

  const rows = useMemo(() => {
    let list = result.rows
    if (focusUserId) {
      list = list.filter(r => r.userId === focusUserId)
    }
    if (statusFilter !== "all") {
      list = list.filter(r => r.status === statusFilter)
    }
    return list
  }, [result.rows, focusUserId, statusFilter])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <TeamSupervisionKpiBar
        kpis={result.kpis}
        filter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          Personas
        </span>
        <span className="text-xs text-neutral-500 tabular-nums">
          {rows.length}
          {statusFilter !== "all" ? " · filtro" : null}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-4 scrollbar-none">
        {rows.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl bg-white/2 text-sm text-neutral-500">
            Nadie en este filtro
          </div>
        ) : (
          rows.map(row => (
            <TeamSupervisionUserRow
              key={row.userId}
              row={row}
              expanded={expandedId === row.userId}
              onToggle={() =>
                setExpandedId(prev =>
                  prev === row.userId ? null : row.userId,
                )
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

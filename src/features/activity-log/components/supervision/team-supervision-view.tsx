"use client"

import { useMemo, useState } from "react"

import type { User } from "@/features/users/types/user.types"
import { cn } from "@/shared/utils/utils"

import type { ActivityLog } from "../../types/activity-log.types"
import type {
  ComplianceStatus,
  TeamSupervisionStatusFilter,
  TeamUserCompliance,
} from "../../types/team-supervision.types"
import { buildTeamSupervision } from "../../selectors/build-team-supervision"
import { TeamSupervisionKpiBar } from "./team-supervision-kpi-bar"
import { TeamSupervisionSkeleton } from "../skeletons/team-supervision-skeleton"
import { TeamSupervisionUserRow } from "./team-supervision-user-row"

type Props = {
  users: User[]
  logs: ActivityLog[]
  loading?: boolean
  focusUserId?: string
}

type SectionDef = {
  key: ComplianceStatus
  title: string
  subtitle: string
  dot: string
}

const SECTIONS: SectionDef[] = [
  {
    key: "ok",
    title: "Activos",
    subtitle: "Con registro manual",
    dot: "bg-emerald-400",
  },
  {
    key: "partial",
    title: "Parciales",
    subtitle: "Solo automáticos o incompletos",
    dot: "bg-amber-400",
  },
  {
    key: "missing",
    title: "Sin registro",
    subtitle: "Ninguna entrada en el periodo",
    dot: "bg-rose-400",
  },
]

/** Dentro de cada sección: más entradas primero, luego más MANUAL, luego nombre. */
function sortWithinSection(a: TeamUserCompliance, b: TeamUserCompliance) {
  if (b.total !== a.total) return b.total - a.total
  if (b.manual !== a.manual) return b.manual - a.manual
  return a.user.name.localeCompare(b.user.name, "es")
}

function SectionHeader({
  section,
  count,
}: {
  section: SectionDef
  count: number
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-0.5 pt-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("size-1.5 shrink-0 rounded-full", section.dot)} />
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          {section.title}
        </span>
        <span className="truncate text-[11px] text-neutral-600">
          {section.subtitle}
        </span>
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-neutral-600">
        {count}
      </span>
    </div>
  )
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

  const grouped = useMemo(() => {
    let list = result.rows
    if (focusUserId) {
      list = list.filter(r => r.userId === focusUserId)
    }
    if (statusFilter !== "all") {
      list = list.filter(r => r.status === statusFilter)
    }

    const buckets: Record<ComplianceStatus, TeamUserCompliance[]> = {
      ok: [],
      partial: [],
      missing: [],
    }

    for (const row of list) {
      buckets[row.status].push(row)
    }

    for (const key of Object.keys(buckets) as ComplianceStatus[]) {
      buckets[key].sort(sortWithinSection)
    }

    return buckets
  }, [result.rows, focusUserId, statusFilter])

  const visibleSections = useMemo(() => {
    if (statusFilter !== "all") {
      return SECTIONS.filter(s => s.key === statusFilter)
    }
    return SECTIONS
  }, [statusFilter])

  const totalVisible =
    grouped.ok.length + grouped.partial.length + grouped.missing.length

  if (loading) {
    return <TeamSupervisionSkeleton />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">

      <div className="w-full min-w-0 shrink-0">
        <TeamSupervisionKpiBar
          kpis={result.kpis}
          filter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto pb-4 scrollbar-none">
        {totalVisible === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl bg-white/2 text-sm text-neutral-500">
            Nadie en este filtro
          </div>
        ) : (
          visibleSections.map(section => {
            const rows = grouped[section.key]
            if (rows.length === 0) return null

            return (
              <section key={section.key} className="space-y-1.5">
                <SectionHeader section={section} count={rows.length} />
                <div className="space-y-1.5">
                  {rows.map(row => (
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
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
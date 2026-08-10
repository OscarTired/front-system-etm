"use client"

import { cn } from "@/shared/utils/utils"
import type {
  TeamSupervisionKpis,
  TeamSupervisionStatusFilter,
} from "../../types/team-supervision.types"

type Props = {
  kpis: TeamSupervisionKpis
  filter: TeamSupervisionStatusFilter
  onFilterChange: (filter: TeamSupervisionStatusFilter) => void
  loading?: boolean
}

type Card = {
  key: string
  label: string
  value: string
  hint?: string
  filter: TeamSupervisionStatusFilter
  tone?: "neutral" | "danger" | "warn" | "ok"
}

const EMPTY_KPIS: TeamSupervisionKpis = {
  teamSize: 0,
  withLogs: 0,
  missing: 0,
  partial: 0,
  ok: 0,
  coveragePct: 0,
  totalEntries: 0,
  manualEntries: 0,
  autoEntries: 0,
}

export function TeamSupervisionKpiBar({
  kpis,
  filter,
  onFilterChange,
  loading = false,
}: Props) {
  const data = loading ? EMPTY_KPIS : kpis

  const cards: Card[] = [
    {
      key: "coverage",
      label: "Cobertura",
      value: `${data.coveragePct}%`,
      hint: `${data.withLogs}/${data.teamSize}`,
      filter: "all",
      tone:
        data.coveragePct >= 80
          ? "ok"
          : data.coveragePct >= 50
            ? "warn"
            : "danger",
    },
    {
      key: "missing",
      label: "Sin registro",
      value: String(data.missing),
      filter: "missing",
      tone: data.missing > 0 ? "danger" : "ok",
    },
    {
      key: "partial",
      label: "Parcial",
      value: String(data.partial),
      hint: "solo AUTO",
      filter: "partial",
      tone: data.partial > 0 ? "warn" : "neutral",
    },
    {
      key: "entries",
      label: "Entradas",
      value: String(data.totalEntries),
      hint: `${data.manualEntries} man · ${data.autoEntries} auto`,
      filter: "all",
      tone: "neutral",
    },
  ]

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 tablet:grid-cols-4">
      {cards.map(card => {
        const active = card.filter !== "all" && filter === card.filter

        return (
          <button
            key={card.key}
            type="button"
            disabled={loading}
            onClick={() => {
              if (loading) return
              if (card.filter === "all") {
                onFilterChange("all")
                return
              }
              onFilterChange(filter === card.filter ? "all" : card.filter)
            }}
            className={cn(
              "flex min-w-0 flex-col items-start rounded-2xl px-3.5 py-3 text-left transition",
              "bg-white/5 hover:bg-white/8",
              active && "bg-white/1 ring-0",
              loading && "pointer-events-none animate-pulse",
            )}
          >
            <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              {card.label}
            </span>
            {loading ? (
              <>
                <span className="mt-1 h-7 w-12 rounded bg-white/10" />
                <span className="mt-1 h-3 w-16 rounded bg-white/8" />
              </>
            ) : (
              <>
                <span
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums tracking-tight",
                    card.tone === "danger" && "text-rose-400",
                    card.tone === "warn" && "text-amber-400",
                    card.tone === "ok" && "text-emerald-400",
                    card.tone === "neutral" && "text-neutral-100",
                  )}
                >
                  {card.value}
                </span>
                {card.hint ? (
                  <span className="mt-0.5 text-[11px] text-neutral-500">
                    {card.hint}
                  </span>
                ) : null}
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

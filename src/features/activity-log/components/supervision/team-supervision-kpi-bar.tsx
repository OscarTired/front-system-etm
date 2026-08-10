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
}

type Card = {
  key: string
  label: string
  value: string
  hint?: string
  filter: TeamSupervisionStatusFilter
  tone?: "neutral" | "danger" | "warn" | "ok"
}

export function TeamSupervisionKpiBar({
  kpis,
  filter,
  onFilterChange,
}: Props) {
  const cards: Card[] = [
    {
      key: "coverage",
      label: "Cobertura",
      value: `${kpis.coveragePct}%`,
      hint: `${kpis.withLogs}/${kpis.teamSize}`,
      filter: "all",
      tone:
        kpis.coveragePct >= 80
          ? "ok"
          : kpis.coveragePct >= 50
            ? "warn"
            : "danger",
    },
    {
      key: "missing",
      label: "Sin registro",
      value: String(kpis.missing),
      filter: "missing",
      tone: kpis.missing > 0 ? "danger" : "ok",
    },
    {
      key: "partial",
      label: "Parcial",
      value: String(kpis.partial),
      hint: "solo AUTO",
      filter: "partial",
      tone: kpis.partial > 0 ? "warn" : "neutral",
    },
    {
      key: "entries",
      label: "Entradas",
      value: String(kpis.totalEntries),
      hint: `${kpis.manualEntries} man · ${kpis.autoEntries} auto`,
      filter: "all",
      tone: "neutral",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
      {cards.map(card => {
        const active = card.filter !== "all" && filter === card.filter

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              if (card.filter === "all") {
                onFilterChange("all")
                return
              }
              onFilterChange(filter === card.filter ? "all" : card.filter)
            }}
            className={cn(
              "flex flex-col items-start rounded-2xl px-3.5 py-3 text-left transition",
              "bg-white/[0.03] hover:bg-white/[0.05]",
              active && "bg-white/[0.08] ring-1 ring-white/10",
            )}
          >
            <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              {card.label}
            </span>
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
          </button>
        )
      })}
    </div>
  )
}

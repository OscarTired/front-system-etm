"use client"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
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
  shortLabel: string
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
  const { isCompact } = useResponsive()
  const data = loading ? EMPTY_KPIS : kpis

  const cards: Card[] = [
    {
      key: "coverage",
      label: "Cobertura",
      shortLabel: "Cob.",
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
      shortLabel: "Sin",
      value: String(data.missing),
      filter: "missing",
      tone: data.missing > 0 ? "danger" : "ok",
    },
    {
      key: "partial",
      label: "Parcial",
      shortLabel: "Parc.",
      value: String(data.partial),
      hint: isCompact ? undefined : "solo AUTO",
      filter: "partial",
      tone: data.partial > 0 ? "warn" : "neutral",
    },
    {
      key: "entries",
      label: "Entradas",
      shortLabel: "Ent.",
      value: String(data.totalEntries),
      hint: isCompact
        ? undefined
        : `${data.manualEntries} man · ${data.autoEntries} auto`,
      filter: "all",
      tone: "neutral",
    },
  ]

  return (
    <div
      className={cn(
        "grid min-w-0 gap-1.5",
        isCompact ? "grid-cols-4" : "grid-cols-2 gap-2 tablet:grid-cols-4",
      )}
    >
      {cards.map(card => {
        const active = card.filter !== "all" && filter === card.filter

        return (
          <button
            key={card.key}
            type="button"
            disabled={loading}
            title={
              card.hint
                ? `${card.label}: ${card.value} (${card.hint})`
                : `${card.label}: ${card.value}`
            }
            onClick={() => {
              if (loading) return
              if (card.filter === "all") {
                onFilterChange("all")
                return
              }
              onFilterChange(filter === card.filter ? "all" : card.filter)
            }}
            className={cn(
              "flex min-w-0 flex-col text-left transition",
              isCompact
                ? "items-center rounded-xl px-1.5 py-2"
                : "items-start rounded-2xl px-3.5 py-3",
              "bg-foreground/5 hover:bg-foreground/10",
              active && "bg-foreground/10 ring-1 ring-white/15",
              loading && "pointer-events-none animate-pulse",
            )}
          >
            <span
              className={cn(
                "font-semibold tracking-wider text-muted-foreground uppercase",
                isCompact ? "text-[8px]" : "text-[10px]",
              )}
            >
              {isCompact ? card.shortLabel : card.label}
            </span>
            {loading ? (
              <>
                <span
                  className={cn(
                    "mt-1 rounded bg-foreground/10",
                    isCompact ? "h-5 w-8" : "h-7 w-12",
                  )}
                />
                {!isCompact && (
                  <span className="mt-1 h-3 w-16 rounded bg-foreground/10" />
                )}
              </>
            ) : (
              <>
                <span
                  className={cn(
                    "font-bold tabular-nums tracking-tight",
                    isCompact ? "mt-0.5 text-base" : "mt-1 text-2xl",
                    card.tone === "danger" && "text-rose-400",
                    card.tone === "warn" && "text-amber-800 dark:text-amber-400",
                    card.tone === "ok" && "text-emerald-700 dark:text-emerald-400",
                    card.tone === "neutral" && "text-foreground",
                  )}
                >
                  {card.value}
                </span>
                {card.hint ? (
                  <span
                    className={cn(
                      "text-muted-foreground",
                      isCompact ? "mt-0 text-[9px]" : "mt-0.5 text-[11px]",
                    )}
                  >
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

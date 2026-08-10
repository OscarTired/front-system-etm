"use client"

import { cn } from "@/shared/utils/utils"

const SECTIONS = [
  { key: "ok", rows: 2, dot: "bg-emerald-400/40" },
  { key: "partial", rows: 1, dot: "bg-amber-400/40" },
  { key: "missing", rows: 4, dot: "bg-rose-400/40" },
] as const

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-start rounded-2xl bg-white/[0.03] px-3.5 py-3"
        >
          <span className="h-2.5 w-16 rounded bg-white/10" />
          <span className="mt-2 h-7 w-12 rounded bg-white/12" />
          <span className="mt-1.5 h-2.5 w-10 rounded bg-white/6" />
        </div>
      ))}
    </div>
  )
}

function RowSkeleton({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3.5 py-3"
      style={{ opacity }}
    >
      {/* Avatar */}
      <span className="size-9 shrink-0 rounded-full bg-white/10" />

      {/* Nombre + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-24 rounded bg-white/12" />
          <span className="h-4 w-14 rounded-md bg-white/8" />
        </div>
        <span className="mt-1.5 block h-2.5 w-36 rounded bg-white/6" />
      </div>

      {/* Dots turno */}
      <div className="hidden items-center gap-1.5 sm:flex">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="size-1.5 rounded-full bg-white/10" />
        ))}
      </div>

      {/* Chevron */}
      <span className="size-4 shrink-0 rounded bg-white/8" />
    </div>
  )
}

/**
 * Calco de TeamSupervisionView:
 * KPIs 2×2 / 4 → 3 secciones (Activos / Parciales / Sin registro)
 * con header + filas avatar | nombre | dots | chevron.
 */
export function TeamSupervisionSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden animate-pulse">
      <KpiSkeleton />

      <div className="min-h-0 flex-1 space-y-5 overflow-hidden pb-4">
        {SECTIONS.map(section => (
          <section key={section.key} className="space-y-1.5">
            {/* Section header */}
            <div className="flex items-baseline justify-between gap-3 px-0.5 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", section.dot)}
                />
                <span className="h-2.5 w-16 rounded bg-white/12" />
                <span className="h-2.5 w-28 rounded bg-white/6" />
              </div>
              <span className="h-2.5 w-4 rounded bg-white/8" />
            </div>

            <div className="space-y-1.5">
              {Array.from({ length: section.rows }).map((_, i) => (
                <RowSkeleton
                  key={i}
                  opacity={1 - i * 0.12}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

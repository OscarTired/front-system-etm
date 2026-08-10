"use client"

import { cn } from "@/shared/utils/utils"

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

/**
 * Calco de AgendaMonthView:
 * - Misma estructura: header Lun–Dom + 6 filas × 7 celdas
 * - Mismos bordes, paddings (p-1 mobile / p-1.5 desktop vía clases responsive)
 * - Día: círculo size-7 (mobile) / size-6 (tablet+) arriba
 * - Desktop: 1–2 barras tipo event card; mobile: dots
 */
export function AgendaMonthSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col animate-pulse overflow-hidden rounded-2xl bg-[#0c0c0e] shadow-2xl backdrop-blur-xl">
      {/* Cabecera fija — idéntica a month-view */}
      <div className="grid shrink-0 grid-cols-7 border-b border-white/5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-center py-2",
              i >= 5 && "bg-white/2",
            )}
          >
            <span className="h-2.5 w-7 rounded bg-white/10 tablet:h-3 tablet:w-8" />
          </div>
        ))}
      </div>

      {/* Cuerpo: 6 semanas */}
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
            {Array.from({ length: 7 }).map((_, day) => {
              const isWeekend = day >= 5
              // Variar contenido para que no se vea plancha plana
              const hasEvents = (week + day) % 3 === 0
              const hasDouble = (week + day) % 6 === 0

              return (
                <div
                  key={day}
                  className={cn(
                    "relative flex min-h-0 flex-col overflow-hidden border-r border-white/5 last:border-r-0",
                    // Mobile: centrado como month-view isMobile
                    "items-center justify-start gap-0.5 p-1",
                    // Desktop: stretch + p-1.5
                    "tablet:items-stretch tablet:gap-1 tablet:p-1.5",
                    isWeekend && "bg-white/1.5",
                    // días fuera de mes / futuro: más tenues
                    week === 0 && day < 2 && "opacity-35",
                    week === 5 && day > 3 && "opacity-35",
                  )}
                >
                  {/* Número del día */}
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full bg-white/8",
                      "size-7 tablet:size-6",
                      week === 1 && day === 0 && "bg-amber-400/40",
                    )}
                  />

                  {/* Mobile dots */}
                  {hasEvents ? (
                    <div className="mt-0.5 flex flex-wrap items-center justify-center gap-0.5 tablet:hidden">
                      <span className="size-1.5 rounded-full bg-white/20" />
                      {hasDouble ? (
                        <span className="size-1.5 rounded-full bg-white/12" />
                      ) : null}
                    </div>
                  ) : null}

                  {/* Desktop event cards */}
                  {hasEvents ? (
                    <div className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden tablet:flex">
                      <div className="h-5 w-full rounded-md bg-white/8" />
                      {hasDouble ? (
                        <div className="h-5 w-4/5 rounded-md bg-white/5" />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

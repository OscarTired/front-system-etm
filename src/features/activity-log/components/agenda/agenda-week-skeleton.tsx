"use client"

import { SHIFT_GROUPS } from "../../constants/shift-definitions"
import { cn } from "@/shared/utils/utils"

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

/**
 * Calco exacto y fiel del AgendaWeekView adaptado para el Skeleton:
 * - Estructura, alturas, paddings y clases idénticas tanto para Desktop/Tablet como para Móvil.
 */
export function AgendaWeekSkeleton() {
  return (
    <>
      {/* ========== DESKTOP / TABLET SKELETON ========== */}
      <div className="hidden h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl tablet:flex">
        <div className="min-h-0 flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div
            className="grid h-full min-h-full min-w-210 w-full bg-[#0c0c0e] animate-pulse"
            style={{
              gridTemplateColumns: "11rem repeat(7, minmax(0, 1fr))",
              gridTemplateRows: `auto repeat(${SHIFT_GROUPS.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Esquina superior izquierda */}
            <div className="sticky left-0 top-0 z-30 flex items-center justify-center border-b border-white/5 bg-[#0c0c0e] p-3">
              <div className="h-3 w-20 rounded bg-white/10" />
            </div>

            {/* Cabeceras de días */}
            {WEEKDAY_LABELS.map((label, i) => {
              const isWeekend = i >= 5
              return (
                <div
                  key={label}
                  className={cn(
                    "sticky top-0 z-20 flex flex-col items-center justify-center border-b border-white/5 bg-[#0c0c0e] px-3 py-3 text-center",
                    isWeekend && "bg-white/2",
                    i === 2 && "bg-amber-500/10",
                  )}
                >
                  <div className="h-2.5 w-8 rounded bg-white/10" />
                  <div className="mt-1.5 flex justify-center">
                    <div className="h-8 w-8 rounded-xl bg-white/8" />
                  </div>
                </div>
              )
            })}

            {/* Filas de turnos */}
            {SHIFT_GROUPS.map((group, gi) => {
              const isLast = gi === SHIFT_GROUPS.length - 1

              return (
                <div key={group.key} className="contents">
                  {/* Label del turno */}
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex flex-col justify-center bg-[#0c0c0e] px-3.5 py-3",
                      !isLast && "border-b border-white/5",
                    )}
                  >
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="size-3.5 rounded bg-white/12" />
                        <div className="h-3 w-16 rounded bg-white/12" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {group.slots.map(slot => (
                          <div
                            key={slot.shift}
                            className="h-2.5 w-20 rounded bg-white/8"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Celdas por día */}
                  {WEEKDAY_LABELS.map((_, di) => {
                    const isWeekend = di >= 5
                    return (
                      <div
                        key={`${group.key}-${di}`}
                        className={cn(
                          "min-h-0 bg-[#0c0c0e] p-2 transition-colors duration-150 flex flex-col justify-center",
                          !isLast && "border-b border-white/5",
                          isWeekend && "bg-white/2",
                          di === 2 && "bg-amber-500/2",
                        )}
                      >
                        <div className="flex flex-col justify-center gap-1.5 h-full">
                          {di % 3 === 0 ? (
                            <>
                              <div className="h-8 w-full rounded-md bg-white/8" />
                              {di % 6 === 0 && (
                                <div className="h-8 w-4/5 rounded-md bg-white/5" />
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========== MÓVIL SKELETON ========== */}
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border-0 bg-[#0c0c0e] tablet:hidden animate-pulse">
        {/* Strip horizontal de días */}
        <div
          className={cn(
            "flex shrink-0 gap-1 overflow-x-auto border-0 px-2 py-2.5",
            "[-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden",
          )}
        >
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex min-w-[2.85rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 transition-colors",
                i === 2 && "bg-amber-500/10",
              )}
            >
              <div className="h-2 w-6 rounded bg-white/10" />
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8" />
            </div>
          ))}
        </div>

        {/* Secciones de turnos apiladas */}
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none flex flex-col divide-y divide-white/5">
          {SHIFT_GROUPS.map((group, gi) => (
            <section
              key={group.key}
              className="flex-1 flex flex-col justify-center px-3 py-3.5 min-h-0"
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <div className="size-3.5 rounded bg-white/12" />
                <div className="h-3 w-16 rounded bg-white/12" />
                <div className="h-2.5 w-24 rounded bg-white/8" />
              </div>

              <div className="flex flex-col gap-1.5">
                {gi === 0 || gi === 2 ? (
                  <>
                    <div className="h-9 w-full rounded-lg bg-white/8" />
                    {gi === 0 && (
                      <div className="h-9 w-3/4 rounded-lg bg-white/5" />
                    )}
                  </>
                ) : (
                  <div className="h-8 rounded-lg bg-white/4" />
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
"use client"

import { SHIFT_GROUPS } from "../../constants/shift-definitions"
import { cn } from "@/shared/utils/utils"

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

/**
 * Calco del AgendaWeekView:
 * - tablet+: misma grilla (1 col turnos + 7 días × SHIFT_GROUPS filas)
 * - móvil: strip de días + bloques por turno
 */
export function AgendaWeekSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0c0c0e] shadow-2xl">
      {/* —— Desktop / tablet (calco del grid) —— */}
      <div className="hidden h-full min-h-100 tablet:block">
        <div
          className="grid h-full animate-pulse"
          style={{
            gridTemplateColumns: "11rem repeat(7, minmax(0, 1fr))",
            gridTemplateRows: `auto repeat(${SHIFT_GROUPS.length}, minmax(4.5rem, 1fr))`,
          }}
        >
          <div className="flex items-center justify-center border-b border-r border-white/5 p-3">
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>

          {WEEKDAY_LABELS.map(label => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-1.5 border-b border-l border-white/5 px-2 py-3"
            >
              <div className="h-2.5 w-8 rounded bg-white/10" />
              <div className="h-8 w-8 rounded-xl bg-white/8" />
            </div>
          ))}

          {SHIFT_GROUPS.map((group, gi) => (
            <div key={group.key} className="contents">
              <div className="flex flex-col justify-center gap-1.5 border-b border-r border-white/5 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded bg-white/12" />
                  <div className="h-3 w-16 rounded bg-white/12" />
                </div>
                <div className="flex flex-col gap-1 pl-5">
                  {group.slots.map(slot => (
                    <div
                      key={slot.shift}
                      className="h-2.5 w-20 rounded bg-white/8"
                    />
                  ))}
                </div>
              </div>

              {WEEKDAY_LABELS.map((_, di) => (
                <div
                  key={`${group.key}-${di}`}
                  className={cn(
                    "border-b border-l border-white/5 p-2",
                    gi === SHIFT_GROUPS.length - 1 && "border-b-0",
                  )}
                >
                  <div className="flex h-full min-h-14 flex-col justify-center gap-1.5">
                    {di % 3 === 0 ? (
                      <>
                        <div className="h-8 w-full rounded-md bg-white/8" />
                        {di % 6 === 0 && (
                          <div className="h-8 w-4/5 rounded-md bg-white/5" />
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* —— Móvil (calco del strip + turnos) —— */}
      <div className="flex flex-col animate-pulse tablet:hidden">
        <div className="flex gap-1 border-b border-white/5 px-2 py-2.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex min-w-12 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5",
                i === 2 && "bg-white/8",
              )}
            >
              <div className="h-2 w-6 rounded bg-white/10" />
              <div className="h-6 w-6 rounded-lg bg-white/8" />
            </div>
          ))}
        </div>

        {SHIFT_GROUPS.map((group, gi) => (
          <div
            key={group.key}
            className={cn(
              "border-b border-white/5 px-3 py-3.5",
              gi === SHIFT_GROUPS.length - 1 && "border-b-0",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="size-3.5 rounded bg-white/12" />
              <div className="h-3 w-16 rounded bg-white/12" />
              <div className="h-2.5 w-24 rounded bg-white/8" />
            </div>
            <div className="flex flex-col gap-2">
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
          </div>
        ))}
      </div>
    </div>
  )
}
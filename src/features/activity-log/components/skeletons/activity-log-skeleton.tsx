"use client"

import { SHIFT_GROUPS } from "../../constants/shift-definitions"
import { cn } from "@/shared/utils/utils"

function SkeletonSlotRow({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-white/3 px-3 py-3"
      style={{ opacity }}
    >
      <span className="size-8 shrink-0 rounded-full bg-white/8" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="block h-3.5 w-32 max-w-[45%] rounded bg-white/10" />
        <span className="block h-3 w-48 max-w-[60%] rounded bg-white/6" />
      </div>
      <span className="h-3 w-12 shrink-0 rounded bg-white/6" />
    </div>
  )
}

function SkeletonEmptyHint() {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="h-3 w-36 rounded bg-white/5" />
    </div>
  )
}

/**
 * Calco de la vista Día:
 * - Un bloque por cada SHIFT_GROUP (Mañana, Almuerzo, Tarde, Noche)
 * - Dentro, una fila skeleton por cada slot del grupo
 * - Misma estructura visual que ShiftGroupSection
 */
export function ActivityLogSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      {SHIFT_GROUPS.map((group, groupIndex) => {
        const isOptionalGroup = group.slots.every(s => !s.required)

        return (
          <div
            key={group.key}
            className={cn(
              "rounded-2xl bg-white/3 p-4",
              groupIndex > 1 && "opacity-90",
            )}
          >
            {/* Header del grupo */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="size-4 shrink-0 rounded-sm bg-white/10" />
              <span className="h-3.5 w-16 rounded bg-white/10" />
              {isOptionalGroup && (
                <span className="h-4 w-14 rounded-md bg-white/6" />
              )}
            </div>

            {/* Slots */}
            <div className="flex flex-col gap-2">
              {group.slots.map((slot, slotIndex) => (
                <div key={slot.shift} className="flex flex-col gap-1.5">
                  {/* Label de la sub-franja (horas) */}
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-20 rounded bg-white/6" />
                  </div>

                  {/* Contenido: fila o placeholder vacío */}
                  {groupIndex === 0 && slotIndex === 0 ? (
                    <SkeletonSlotRow opacity={1} />
                  ) : groupIndex === 0 && slotIndex === 1 ? (
                    <SkeletonSlotRow opacity={0.55} />
                  ) : (
                    <SkeletonEmptyHint />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
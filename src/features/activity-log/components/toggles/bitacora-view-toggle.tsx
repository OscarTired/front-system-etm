"use client"

import { cn } from "@/shared/utils/utils"
import {
  useBitacoraViewStore,
  type BitacoraViewMode,
} from "../../store/bitacora-view-store"

const OPTIONS: { key: BitacoraViewMode; label: string }[] = [
  { key: "day", label: "Día" },
  { key: "agenda", label: "Agenda" },
]

export function BitacoraViewToggle() {
  const value = useBitacoraViewStore(s => s.viewMode)
  const onChange = useBitacoraViewStore(s => s.setViewMode)

  return (
    <div className="inline-flex items-center rounded-lg bg-white/4 p-1">
      {OPTIONS.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={cn(
            "rounded-md px-3 py-0.5 text-sm font-semibold transition",
            value === option.key
              ? "bg-white/10 text-white"
              : "text-neutral-500 hover:text-neutral-300",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
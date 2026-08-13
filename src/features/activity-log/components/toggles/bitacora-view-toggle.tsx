"use client"

import { Columns3, Grid3x3, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import {
  useBitacoraViewStore,
  type BitacoraViewMode,
} from "../../store/bitacora-view-store"

/** Iconos bien distintos: día ≠ semana ≠ mes */
const OPTIONS: {
  key: BitacoraViewMode
  label: string
  Icon: typeof Sun
}[] = [
  { key: "day", label: "Día", Icon: Sun },
  { key: "agenda", label: "Semana", Icon: Columns3 },
  { key: "month", label: "Mes", Icon: Grid3x3 },
]

type Props = {
  /** Solo iconos (toolbar móvil) */
  compact?: boolean
}

export function BitacoraViewToggle({ compact = false }: Props) {
  const value = useBitacoraViewStore(s => s.viewMode)
  const onChange = useBitacoraViewStore(s => s.setViewMode)

  return (
    <div className="inline-flex items-center rounded-lg bg-foreground/5 p-0.5">
      {OPTIONS.map(option => {
        const Icon = option.Icon
        const active = value === option.key

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center rounded-md transition",
              compact
                ? "size-8"
                : "gap-1.5 px-3 py-0.5 text-sm font-semibold",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-muted-foreground",
            )}
          >
            <Icon size={compact ? 15 : 14} />
            {!compact && <span>{option.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

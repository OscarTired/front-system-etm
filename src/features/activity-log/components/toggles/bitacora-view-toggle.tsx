"use client"

import { Columns3, Grid3x3, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import {
  useBitacoraViewStore,
  type BitacoraViewMode,
} from "../../store/bitacora-view-store"
import { useSwipeSegment } from "./use-swipe-segment"

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

const KEYS = OPTIONS.map(o => o.key) as BitacoraViewMode[]

type Props = {
  /** Solo iconos (toolbar móvil) — targets ≥ 44px + swipe */
  compact?: boolean
}

export function BitacoraViewToggle({ compact = false }: Props) {
  const value = useBitacoraViewStore(s => s.viewMode)
  const onChange = useBitacoraViewStore(s => s.setViewMode)
  const swipe = useSwipeSegment(KEYS, value, onChange)

  return (
    <div
      className="inline-flex touch-pan-y items-center rounded-lg bg-foreground/5 p-0.5"
      {...swipe}
      role="group"
      aria-label="Vista de bitácora"
    >
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
              // compact: área táctil ~44px (size-11), no size-8
              compact
                ? "size-11"
                : "gap-1.5 px-3 py-0.5 text-sm font-semibold",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={compact ? 16 : 14} />
            {!compact && <span>{option.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

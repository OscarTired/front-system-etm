"use client"

import { Eye, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import {
  useTeamBitacoraViewStore,
  type TeamBitacoraViewMode,
} from "../../store/team-bitacora-view-store"

const OPTIONS: {
  key: TeamBitacoraViewMode
  label: string
  Icon: typeof Sun
}[] = [
  { key: "day", label: "Día", Icon: Sun },
  { key: "supervision", label: "Supervisión", Icon: Eye },
]

type Props = {
  compact?: boolean
}

export function TeamBitacoraViewToggle({ compact = false }: Props) {
  const value = useTeamBitacoraViewStore(s => s.viewMode)
  const onChange = useTeamBitacoraViewStore(s => s.setViewMode)

  return (
    <div className="inline-flex items-center rounded-lg bg-white/4 p-0.5">
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
                ? "bg-white/10 text-white"
                : "text-neutral-500 hover:text-neutral-300",
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

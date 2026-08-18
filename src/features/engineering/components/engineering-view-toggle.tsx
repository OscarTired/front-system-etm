"use client"

import { Columns3, Users } from "lucide-react"
import { cn } from "@/shared/utils/utils"
import {
  useEngineeringViewStore,
  type EngineeringViewMode,
} from "../store/engineering-view-store"

const OPTIONS: {
  key: EngineeringViewMode
  label: string
  Icon: typeof Columns3
}[] = [
  { key: "processes", label: "Procesos", Icon: Columns3 },
  { key: "list", label: "Lista", Icon: Users },
]

type Props = { compact?: boolean }

export function EngineeringViewToggle({ compact = false }: Props) {
  const value = useEngineeringViewStore(s => s.viewMode)
  const onChange = useEngineeringViewStore(s => s.setViewMode)

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
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md font-semibold transition",
              compact
                ? "px-2.5 py-1 text-xs"
                : "px-3 py-0.5 text-sm",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={compact ? 14 : 14} />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

"use client"

import { Monitor, Moon, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useThemeStore, type ThemeMode } from "./theme-store"

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Oscuro", icon: Moon },
  { mode: "system", label: "Sistema", icon: Monitor },
]

type Props = {
  className?: string
  /** Solo iconos (sidebar). */
  compact?: boolean
}

export function ThemeToggle({ className, compact = false }: Props) {
  const mode = useThemeStore(s => s.mode)
  const setMode = useThemeStore(s => s.setMode)

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {!compact && (
        <p className="text-xs font-medium text-muted-foreground">Tema</p>
      )}
      <div
        className={cn(
          "flex gap-1 rounded-xl bg-muted/60 p-1",
          compact && "w-full",
        )}
      >
        {OPTIONS.map(({ mode: m, label, icon: Icon }) => {
          const active = mode === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              title={label}
              aria-label={label}
              aria-pressed={active}
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg transition-colors",
                compact ? "gap-0 px-1.5 py-1.5" : "gap-1.5 px-2 py-2 text-xs font-medium",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={compact ? 15 : 14} strokeWidth={2} />
              {!compact && label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

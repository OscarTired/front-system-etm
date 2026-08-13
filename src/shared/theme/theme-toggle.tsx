"use client"

import { Monitor, Moon, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useThemeStore, type ThemeMode } from "./theme-store"

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Oscuro", icon: Moon },
  { mode: "system", label: "Sistema", icon: Monitor },
]

export function ThemeToggle({ className }: { className?: string }) {
  const mode = useThemeStore(s => s.mode)
  const setMode = useThemeStore(s => s.setMode)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs font-medium text-muted-foreground">Tema</p>
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
        {OPTIONS.map(({ mode: m, label, icon: Icon }) => {
          const active = mode === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

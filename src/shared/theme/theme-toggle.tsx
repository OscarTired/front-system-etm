"use client"

import { Monitor, Moon, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useThemeStore, type ThemeMode } from "./theme-store"

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Oscuro", icon: Moon },
  { mode: "system", label: "Sistema", icon: Monitor },
]

/** Botones del header sidebar / topbar — hover y pressed visibles. */
export const chromeIconButtonClass =
  "flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15 active:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"

type Props = {
  className?: string
  /** Segmented control (profile / settings). */
  compact?: boolean
  /**
   * Un solo botón sol/luna (estilo VS Code web).
   * Icono = tema al que puedes pasar; click alterna light ↔ dark.
   */
  variant?: "segmented" | "icon"
}

export function ThemeToggle({
  className,
  compact = false,
  variant = "segmented",
}: Props) {
  const mode = useThemeStore(s => s.mode)
  const resolved = useThemeStore(s => s.resolved)
  const setMode = useThemeStore(s => s.setMode)

  if (variant === "icon") {
    const isDark = resolved === "dark"
    // En oscuro mostramos sol (pasar a claro); en claro, luna.
    const Icon = isDark ? Sun : Moon
    const next: ThemeMode = isDark ? "light" : "dark"
    const label = isDark ? "Tema claro" : "Tema oscuro"

    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => setMode(next)}
        className={cn(
          chromeIconButtonClass,
          "size-8",
          className,
        )}
      >
        <Icon size={16} strokeWidth={1.75} />
      </button>
    )
  }

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
                "flex flex-1 items-center justify-center rounded-lg transition-colors duration-150",
                compact
                  ? "gap-0 px-1.5 py-1.5"
                  : "gap-1.5 px-2 py-2 text-xs font-medium",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15",
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

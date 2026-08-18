"use client"

import { Moon, Sun } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  isToday: boolean
  onGoToToday: () => void
  /** Solo icono (móvil). Desktop usa label. */
  compact?: boolean
  className?: string
}

/**
 * Ir a hoy.
 * - Hoy: sol ámbar (estado actual, no actionable de más).
 * - Fecha pasada: luna (invita a volver) + color más sobrio.
 */
export function GoToTodayButton({
  isToday,
  onGoToToday,
  compact = false,
  className,
}: Props) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onGoToToday}
        disabled={isToday}
        title={isToday ? "Hoy" : "Ir a hoy"}
        aria-label={isToday ? "Hoy" : "Ir a hoy"}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg transition-all",
          isToday
            ? "cursor-default bg-amber-500/25 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400/50"
            : "bg-indigo-500/20 text-indigo-800 hover:bg-indigo-500/30 hover:text-indigo-950 dark:bg-indigo-400/15 dark:text-indigo-200 dark:hover:text-indigo-100",
          className,
        )}
      >
        {isToday ? (
          <Sun size={16} strokeWidth={2} />
        ) : (
          <Moon size={16} strokeWidth={2} />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onGoToToday}
      disabled={isToday}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-all",
        isToday
          ? "cursor-default bg-amber-500/25 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400/50"
          : "bg-indigo-500/20 text-indigo-800 hover:bg-indigo-500/30 hover:text-indigo-950 dark:bg-indigo-400/15 dark:text-indigo-200 dark:hover:text-indigo-100",
        className,
      )}
    >
      {isToday ? (
        <Sun size={14} strokeWidth={2} className="shrink-0" />
      ) : (
        <Moon size={14} strokeWidth={2} className="shrink-0" />
      )}
      Hoy
    </button>
  )
}

"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/utils/utils"

/**
 * Sombra única de elevación suave (cards, toasts, botones chrome).
 * Misma que IconAction — evita shadow-lg/xl que se recortan con
 * overflow-hidden del AppShell y se ven pesadas en light.
 */
export const ELEVATION_SHADOW =
  "shadow-sm shadow-black/15 dark:shadow-black/40"

/** Superficie compartida: info / material / editar / borrar */
export const CHROME_ICON_BTN =
  `flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80 ${ELEVATION_SHADOW} transition-colors hover:bg-muted/80 hover:text-foreground active:bg-muted/70`

type Props = {
  icon: LucideIcon
  variant?: "default" | "danger"
  disabled?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  "aria-label"?: string
}

export function IconAction({
  icon: Icon,
  variant = "default",
  disabled = false,
  onClick,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const danger = variant === "danger"

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onClick={event => {
        event.preventDefault()
        event.stopPropagation()
        if (disabled) return
        onClick(event)
      }}
      className={cn(
        CHROME_ICON_BTN,
        disabled && "cursor-not-allowed opacity-35",
        !disabled &&
          danger &&
          "hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400",
        className,
      )}
    >
      <Icon size={14} strokeWidth={2.25} />
    </button>
  )
}

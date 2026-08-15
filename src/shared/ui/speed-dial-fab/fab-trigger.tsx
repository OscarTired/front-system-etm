"use client"

import { forwardRef } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props = {
  icon: LucideIcon
  label: string
  active?: boolean
  badge?: React.ReactNode
  /** Acento del círculo FAB — clases de tema, no hex. */
  accentClassName?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">

/**
 * - Desktop: pastilla ícono + label.
 * - Mobile FAB: círculo neutro = bg-foreground / text-background (tema).
 */
export const FabTrigger = forwardRef<HTMLButtonElement, Props>(
  (
    {
      icon: Icon,
      label,
      active = false,
      badge,
      accentClassName,
      className,
      ...props
    },
    ref,
  ) => {
    const { isMobile } = useResponsive()

    if (!isMobile) {
      return (
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex h-8 items-center gap-2 rounded-xl px-2 text-foreground transition-colors hover:bg-muted",
            active && "bg-muted",
            className,
          )}
          {...props}
        >
          <Icon size={14} strokeWidth={2} className="shrink-0" />
          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] select-none">
            {label}
          </span>
          {badge}
        </button>
      )
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm shadow-black/15 dark:shadow-black/40 transition active:scale-95",
          accentClassName ??
            cn(
              "bg-foreground text-background",
              active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            ),
          className,
        )}
        {...props}
      >
        <Icon size={17} strokeWidth={2.2} />
        {badge && (
          <span className="absolute -top-1 -right-1">{badge}</span>
        )}
      </button>
    )
  },
)

FabTrigger.displayName = "FabTrigger"

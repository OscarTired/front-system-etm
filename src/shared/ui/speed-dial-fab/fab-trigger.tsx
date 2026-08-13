"use client"

import { forwardRef } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props = {
  icon: LucideIcon
  label: string
  active?: boolean
  /**
   * Badge (ej. contador de historial). El componente decide dónde
   * ponerlo según el modo — el caller solo define su contenido/color.
   */
  badge?: React.ReactNode
  /**
   * Acento del círculo en modo FAB (ej. "bg-emerald-400 text-black"
   * para "Nueva tarea"). Sin esto, círculo neutro como el resto.
   */
  accentClassName?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">

/**
 * Único trigger de Filtro/Orden/Historial/Exportar/Crear.
 *
 * - Desktop (fila inline en el header): pastilla ícono + label.
 * - Mobile (SpeedDialFab): solo círculo con ícono (sin leyenda).
 *   `label` queda como aria-label / title para accesibilidad.
 *
 * `ref` apunta al botón clickeable (PopoverTrigger asChild ok).
 */
export const FabTrigger = forwardRef<HTMLButtonElement, Props>(
  (
    { icon: Icon, label, active = false, badge, accentClassName, className, ...props },
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
          "relative flex size-11 shrink-0 items-center justify-center rounded-full text-foreground shadow-lg transition active:scale-95",
          accentClassName ?? cn("bg-[#1a1a1a]", active && "bg-foreground/20"),
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

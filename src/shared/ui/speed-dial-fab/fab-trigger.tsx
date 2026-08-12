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
 * - Desktop (fila inline en el header): UNA pastilla ícono+label —
 *   el look de siempre, sin cambios visuales.
 * - Mobile (fila dentro del SpeedDialFab): se separa en pastilla de
 *   label (estado legible sin tocar nada) + botón circular de ícono
 *   (el tap target real) — mismo componente, sin duplicar markup
 *   en cada trigger ni depender de que SpeedDialFab le adivine el
 *   estilo a un <button> genérico.
 *
 * `ref` siempre apunta al elemento clickeable real (el botón), así
 * que sigue funcionando como `PopoverTrigger asChild` en los casos
 * que abren un popover (Filtro, Orden, Exportar).
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
            "flex h-8 items-center gap-2 rounded-xl px-2 text-white transition-colors hover:bg-[#101012]",
            active && "bg-[#101012]",
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
      <div className="flex items-center justify-end gap-2">
        <span className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-[#1a1a1a]/90 px-4 text-xs font-semibold text-white shadow-lg ring-1 ring-white/10 backdrop-blur-xl select-none">
          {label}
        </span>

        <button
          ref={ref}
          type="button"
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg ring-1 ring-white/10 backdrop-blur-xl transition active:scale-95",
            accentClassName ?? cn("bg-[#1a1a1a]/90", active && "bg-white/15"),
            className,
          )}
          {...props}
        >
          <Icon size={17} strokeWidth={2.2} />
          {badge && (
            <span className="absolute -top-1 -right-1">{badge}</span>
          )}
        </button>
      </div>
    )
  },
)

FabTrigger.displayName = "FabTrigger"
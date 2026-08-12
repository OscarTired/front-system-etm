"use client"

import {
  forwardRef,
} from "react"

import {
  Funnel,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  FabTrigger,
} from "@/shared/ui/speed-dial-fab/fab-trigger"

type Props={
  expanded?:boolean
  active?:boolean
  /**
   * true = hay chips activos. Solo afecta el look en mobile (FAB):
   * el círculo se pinta distinto para que se note DENTRO de la
   * lista del FAB que hay filtros aplicados, no solo arriba al lado
   * de la lupa. Vuelve a verse neutro en cuanto chips.length llega
   * a 0 (se borra el último filtro) — sin estado propio de "visto".
   */
  hasActiveFilters?:boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const FilterAddButton=
  forwardRef<
    HTMLButtonElement,
    Props
  >(
    (
      {
        expanded:_expanded,
        active=false,
        hasActiveFilters=false,
        className,
        ...props
      },
      ref
    )=>{

      const { isMobile } = useResponsive()

      // Mobile (fila del FAB): se actualiza accentClassName para que coincida 
      // exactamente con el estilo de la burbuja verde del history button.
      if (isMobile) {
        return (
          <FabTrigger
            ref={ref}
            icon={Funnel}
            label="FILTROS"
            active={active}
            accentClassName={
              hasActiveFilters
                ? "animate-history-bounce bg-emerald-500/90 text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : undefined
            }
            className={className}
            {...props}
          />
        )
      }

      return (

      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white select-none transition-all duration-200",
          active
            ? "bg-[#101012]"
            : "hover:bg-[#101012]",
          className
        )}
        {...props}
      >

        <Funnel
          size={14}
          strokeWidth={2}
        />

      </button>

      )
    }
  )

FilterAddButton.displayName=
  "FilterAddButton"
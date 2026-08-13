"use client"

import { CheckCircle2 } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"

type Props={
  completedCount:number
  expanded:boolean
  onClick:()=>void
}

// emerald-500 — mismo hex que usa el resto del sistema de badges para
// "completado". Un solo valor, una sola fuente para el color en sí.
const EMERALD_HEX = "#10b981"

export function ProjectCompletedTasksCard({
  completedCount,
  expanded,
  onClick,
}:Props){

  const { isMobile } = useResponsive()

  // Mismo sistema que ProcessMiniCard/DynamicBadge (useBadgeColors):
  // el alpha ya está resuelto por tema (más fuerte en light, donde el
  // mismo % de color se percibe mucho más pálido que sobre negro) en
  // un solo lugar reutilizable, en vez de pares dark:/light hardcoded
  // a mano por componente.
  const badge = useBadgeColors(EMERALD_HEX, "subtle")

  // Mismo lenguaje visual que el resumen colapsado de KpiCarousel:
  // una sola fila compacta, sin la caja alta/decorativa que sí
  // tiene sentido en desktop dentro del scroll horizontal de w-72.
  if (isMobile) {

    return (

      <button
        type="button"
        onClick={onClick}
        className="flex h-12 w-full items-center gap-2.5 rounded-xl px-3 text-left transition hover:brightness-110"
        style={{
          background: `linear-gradient(135deg, ${badge.background}, transparent)`,
        }}
      >

        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: badge.background }}
        >
          <CheckCircle2 size={14} style={{ color: badge.text }} />
        </div>

        <span className="text-sm font-bold text-foreground">
          {completedCount} finalizadas
        </span>

        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {expanded ? "Ocultar" : "Ver más"}
        </span>

      </button>

    )

  }

  return(

    <button
      type="button"
      onClick={onClick}
      className="group flex h-43.5 w-full flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:brightness-110"
      style={{
        background: `linear-gradient(135deg, ${badge.background}, transparent)`,
      }}
    >

      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full transition duration-200 group-hover:scale-105"
        style={{ backgroundColor: badge.background }}
      >

        <CheckCircle2
          size={20}
          style={{ color: badge.text }}
        />

      </div>

      <p className="text-3xl font-bold text-foreground">
        {completedCount}
      </p>

      <p
        className="mt-1 text-xs font-bold uppercase tracking-[0.18em]"
        style={{ color: badge.text }}
      >
        Finalizadas
      </p>

      <p className="mt-3 text-xs text-muted-foreground">
        {expanded
          ? "Ocultar historial"
          : "Ver historial"}
      </p>

    </button>

  )

}

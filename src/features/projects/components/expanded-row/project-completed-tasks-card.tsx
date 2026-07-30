"use client"

import { CheckCircle2 } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props={
  completedCount:number
  expanded:boolean
  onClick:()=>void
}

export function ProjectCompletedTasksCard({
  completedCount,
  expanded,
  onClick,
}:Props){

  const { isMobile } = useResponsive()

  // Mismo lenguaje visual que el resumen colapsado de KpiCarousel:
  // una sola fila compacta, sin la caja alta/decorativa que sí
  // tiene sentido en desktop dentro del scroll horizontal de w-72.
  if (isMobile) {

    return (

      <button
        type="button"
        onClick={onClick}
        className="flex h-12 w-full items-center gap-2.5 rounded-xl bg-linear-to-br from-emerald-500/4 via-emerald-500/2 to-transparent px-3 text-left transition hover:bg-emerald-500/5"
      >

        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 size={14} className="text-emerald-400" />
        </div>

        <span className="text-sm font-bold text-white">
          {completedCount} finalizadas
        </span>

        <span className="ml-auto shrink-0 text-xs text-neutral-500">
          {expanded ? "Ocultar" : "Ver más"}
        </span>

      </button>

    )

  }

  return(

    <button
      type="button"
      onClick={onClick}
      className="group flex h-43.5 w-full flex-col items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/4 via-emerald-500/2 to-transparent transition-all duration-200 hover:border-emerald-500/20 hover:bg-emerald-500/5"
    >

      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 transition duration-200 group-hover:scale-105 group-hover:bg-emerald-500/15">

        <CheckCircle2
          size={20}
          className="text-emerald-400"
        />

      </div>

      <p className="text-3xl font-bold text-white">
        {completedCount}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
        Finalizadas
      </p>

      <p className="mt-3 text-xs text-neutral-500">
        {expanded
          ? "Ocultar historial"
          : "Ver historial"}
      </p>

    </button>

  )

}
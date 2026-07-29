"use client"

import {
  useState,
} from "react"

import {
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  getBadgeColors,
} from "@/shared/utils/badge-colors"

import {
  CollapsibleSummaryPanel,
} from "@/shared/ui/collapsible-summary-panel/collapsible-summary-panel"

import {
  HorizontalScroll,
} from "@/shared/ui/horizontal-scroll/horizontal-scroll"

type SummaryValue = {
  label: string
  value: string | number
}

type Summary = {
  icon: LucideIcon
  color: string
  label: string
  values: [SummaryValue, SummaryValue]
}

type Props = {
  cards: React.ReactNode[]
  summary: Summary
  defaultExpanded?: boolean
}

export function KpiCarousel({
  cards,
  summary,
  defaultExpanded = false,
}: Props) {

  const {
    isMobile,
  } = useResponsive()

  const [
    expanded,
    setExpanded,
  ] = useState(defaultExpanded)

  const Icon = summary.icon

  const textColor =
    getBadgeColors(summary.color, "subtle").text

  const collapsedView = (

    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:brightness-110 tablet:gap-4 tablet:p-4"
      style={{
        background: `linear-gradient(135deg, ${summary.color}20, #101012)`,
      }}
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
        <Icon size={20} style={{ color: textColor }} />
      </div>

      <span
        className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.18em] tablet:block"
        style={{ color: textColor }}
      >
        {summary.label}
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-6 tablet:gap-8">

        {summary.values.map((value) => (

          <div key={value.label} className="min-w-0 text-right">

            <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
              {value.label}
            </p>

            <p
              className="text-base font-bold leading-tight sm:text-lg"
              style={{ color: textColor }}
            >
              {value.value}
            </p>

          </div>

        ))}

      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-400">
        <MoreHorizontal size={18} />
      </div>

    </button>

  )

  const desktopGrid = (

    <div className="grid grid-cols-2 gap-3 sm:gap-4 laptop:grid-cols-4">
      {cards}
    </div>

  )

  // Igual criterio que el stepper de TaskProductionPanel: HorizontalScroll
  // + cards con altura NATURAL (h-auto), sin min-height impuesta.
  //
  // Antes, cada card vivía en un div con "min-h-27.5" fijo sin importar
  // cuánto contenido tuviera. Si el card traía pocos rows (ej. 1 solo
  // row tipo LOTE/ASIGNACIÓN), el contenido ocupaba una fracción chica
  // de esa altura mínima y quedaba un bloque vacío enorme debajo — el
  // padre le exigía al card ser más alto de lo que necesitaba.
  //
  // Acá el wrapper de cada card ya no impone una altura: cada uno mide
  // lo que su propio contenido pide (como el stepper, donde el alto lo
  // define el contenido — icono + label — no un valor arbitrario).
  const mobileScroll = (

    <div className="w-full">
      <HorizontalScroll>
        {cards.map((card, index) => (

          <div
            key={index}
            className="w-[88%] shrink-0 sm:w-[70%]"
          >
            {card}
          </div>

        ))}
      </HorizontalScroll>
    </div>

  )

  return (

    <div className="flex w-full flex-col">

      <CollapsibleSummaryPanel
        expanded={expanded}
        onCollapse={() => setExpanded(false)}
        collapsed={collapsedView}
      >

        {isMobile ? mobileScroll : desktopGrid}

      </CollapsibleSummaryPanel>

    </div>

  )

}
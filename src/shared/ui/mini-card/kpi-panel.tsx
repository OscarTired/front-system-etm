"use client"

import {
  useState,
  useEffect,
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
  getGlassSurface,
} from "@/shared/utils/badge-colors"

import {
  useThemeStore,
} from "@/shared/theme"

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

export type KpiItem = {
  icon: LucideIcon
  color: string
  label: string
  value: string | number
  rows?: { label: string; value: string | number }[]
}

type Props = {
  cards: React.ReactNode[]
  items?: KpiItem[]
  summary: Summary
  defaultExpanded?: boolean
}

export function KpiCarousel({
  cards,
  items,
  summary,
  defaultExpanded,
}: Props) {
  const theme = useThemeStore(s => s.resolved)


  const {
    isMobile,
    ready,
  } = useResponsive()

  const [
    expanded,
    setExpanded,
  ] = useState(false)

  useEffect(() => {
    if (!ready) return
    setExpanded(
      defaultExpanded !== undefined ? defaultExpanded : !isMobile,
    )
  }, [ready, isMobile, defaultExpanded])

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(0)

  const Icon = summary.icon

  const textColor =
    getBadgeColors(summary.color, "subtle", theme).text

  const collapsedView = (

    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:brightness-110 tablet:gap-4 tablet:p-4"
      style={{
        background: getGlassSurface(summary.color, theme).background,
      }}
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
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

            <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-on-glass-muted sm:text-xs">
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

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-on-glass-muted">
        <MoreHorizontal size={18} />
      </div>

    </button>

  )

  const desktopGrid = (

    <div className="grid grid-cols-2 gap-3 sm:gap-4 laptop:grid-cols-4">
      {cards}
    </div>

  )

  const currentItems = items ?? []
  const activeItem = currentItems[selectedIndex] ?? currentItems[0]
  const activeColors = getBadgeColors(activeItem?.color ?? summary.color, "subtle", theme)
  const ActiveIcon = activeItem?.icon ?? Icon

  // Misma altura que el stepper de TaskProductionPanel (h-16), sin
  // efectos que sobresalgan de la caja del ítem: acá el estado
  // seleccionado se marca solo con borde/color, nunca con box-shadow,
  // porque HorizontalScroll tiene overflow-hidden (vertical y
  // horizontal) y cualquier sombra que sobresalga del propio círculo
  // queda cortada por ese overflow — no importa cuánta altura le des
  // al contenedor, la sombra siempre se recorta ahí.
  const mobileChips = (

    <div className="w-full h-16">
      <HorizontalScroll>
        {currentItems.map((item, index) => {

          const ItemIcon = item.icon
          const colors = getBadgeColors(item.color, "subtle", theme)
          const isSelected = selectedIndex === index

          return (

            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="flex w-14 shrink-0 flex-col items-center gap-1.5 focus:outline-none transition-transform active:scale-95"
            >

              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200"
                style={{
                  backgroundColor: isSelected
                    ? colors.backgroundActive
                    : colors.background,
                  border: isSelected
                    ? `2px solid ${colors.text}`
                    : "2px solid transparent",
                }}
              >
                <ItemIcon size={16} style={{ color: colors.text }} />
              </div>

              <span
                className="max-w-14 truncate text-[10px] font-bold uppercase tracking-wide"
                style={{
                  color: isSelected ? colors.text : "var(--on-glass-faint)",
                }}
              >
                {item.label}
              </span>

            </button>

          )

        })}
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

        {isMobile ? (
          <div
            className="flex w-full flex-col rounded-2xl p-4 tablet:p-5"
            style={{
              background: getGlassSurface(summary.color, theme).background,
            }}
          >
            {mobileChips}

            <div className="mt-3 flex justify-center">
              <div
                className="w-full max-w-3xl rounded-xl px-5 py-3.5 transition-all duration-200"
                style={{
                  background: getGlassSurface(activeItem?.color ?? summary.color, theme).backgroundInset,
                }}
              >
                <div className="flex w-full min-w-0 flex-col gap-1.5">
                  <div className="flex min-w-0 items-center justify-between gap-2">

                    <div className="flex min-w-0 items-center gap-1.5">
                      <ActiveIcon size={13} style={{ color: activeColors.text }} />
                      <span
                        className="truncate text-xs font-bold uppercase tracking-wide"
                        style={{ color: activeColors.text }}
                      >
                        {activeItem?.label ?? summary.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {activeItem?.rows && activeItem.rows.length > 0 ? (
                        activeItem.rows.map((row, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-1.5 text-right">
                            {activeItem.rows!.length > 1 && (
                              <span className="text-[10px] font-bold uppercase text-on-glass-muted">
                                {row.label}:
                              </span>
                            )}
                            <span className="text-xs font-bold" style={{ color: activeColors.text }}>
                              {row.value}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs font-bold" style={{ color: activeColors.text }}>
                          {activeItem?.value ?? ""}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          desktopGrid
        )}

      </CollapsibleSummaryPanel>

    </div>

  )

}

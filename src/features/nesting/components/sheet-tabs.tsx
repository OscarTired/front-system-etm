"use client"

import { useMemo } from "react"
import { cn } from "@/shared/utils/utils"
import { useDragScroll } from "@/shared/ui/horizontal-scroll/use-drag-scroll"
import { useHorizontalFade } from "@/shared/hooks/use-horizontal-fade"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, Layers } from "lucide-react"

export interface SheetTabItem {
  key: string
  label: string
  usagePercent: number
  /** Espesor mm para agrupar pestañas (undefined = sin espesor). */
  thicknessMm?: number
}

export interface SheetTabsProps {
  items: SheetTabItem[]
  activeIndex: number
  onChange: (index: number) => void
  /** Si true, agrupa planchas del mismo espesor en una pestaña con popover. */
  groupByThickness?: boolean
}

function usageBadgeClass(pct: number) {
  if (pct >= 80) return "bg-emerald-500/20 text-emerald-300"
  if (pct >= 50) return "bg-amber-500/20 text-amber-300"
  return "bg-red-500/20 text-red-300"
}

function thicknessKey(mm: number | undefined): string {
  if (mm == null || !(mm > 0)) return "s/esp"
  return (Math.round(mm * 100) / 100).toFixed(2)
}

function thicknessLabel(mm: number | undefined): string {
  if (mm == null || !(mm > 0)) return "s/esp."
  const t = Math.round(mm * 100) / 100
  return Number.isInteger(t) ? `${t} mm` : `${t} mm`
}

type ThicknessGroup = {
  key: string
  thicknessMm?: number
  members: { index: number; item: SheetTabItem }[]
}

export function SheetTabs({
  items,
  activeIndex,
  onChange,
  groupByThickness = true,
}: SheetTabsProps) {
  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  const { leftFade, rightFade } = useHorizontalFade({ containerRef })

  const groups: ThicknessGroup[] = useMemo(() => {
    if (!groupByThickness || items.length === 0) {
      return items.map((item, index) => ({
        key: `single-${index}`,
        thicknessMm: item.thicknessMm,
        members: [{ index, item }],
      }))
    }
    const map = new Map<string, ThicknessGroup>()
    const order: string[] = []
    items.forEach((item, index) => {
      const k = thicknessKey(item.thicknessMm)
      if (!map.has(k)) {
        map.set(k, { key: k, thicknessMm: item.thicknessMm, members: [] })
        order.push(k)
      }
      map.get(k)!.members.push({ index, item })
    })
    return order.map((k) => map.get(k)!)
  }, [items, groupByThickness])

  if (items.length === 0) return null

  return (
    <div
      style={{
        WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
        maskImage: `linear-gradient(to right, transparent 0, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`,
      }}
      className="w-full overflow-hidden rounded-lg bg-white/5"
    >
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        className="themed-scrollbar-x cursor-grab select-none overflow-x-auto overflow-y-hidden p-1 pb-2 active:cursor-grabbing"
      >
        <div className="flex w-max items-center gap-1">
          {groups.map((group) => {
            const multi = group.members.length > 1
            const activeMember = group.members.find((m) => m.index === activeIndex)
            const isGroupActive = Boolean(activeMember)
            const primary = activeMember ?? group.members[0]
            const avgUsage =
              group.members.reduce((s, m) => s + m.item.usagePercent, 0) / group.members.length

            if (!multi) {
              const { index, item } = primary
              const isActive = index === activeIndex
              return (
                <button
                  key={group.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onChange(index)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                    isActive
                      ? "bg-white/10 text-neutral-100 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                      usageBadgeClass(item.usagePercent)
                    )}
                  >
                    {item.usagePercent.toFixed(0)}%
                  </span>
                </button>
              )
            }

            // Grupo por espesor: pestaña compacta + popover con miembros.
            // "N grupos" en vez de índices crudos (#1,#2) que no dicen
            // nada sin abrir el popover; el ícono de capas marca que es
            // un agrupador, no una plancha suelta.
            const groupWord = group.members.length === 1 ? "grupo" : "grupos"
            const tooltip = `${thicknessLabel(group.thicknessMm)} · ${group.members.length} ${groupWord} de plancha (${group.members
              .map((m) => m.item.label)
              .join(", ")})`
            return (
              <Popover key={group.key}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-pressed={isGroupActive}
                    title={tooltip}
                    onClick={() => {
                      if (!isGroupActive) onChange(primary.index)
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                      isGroupActive
                        ? "bg-white/10 text-neutral-100 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5 opacity-70" />
                    <span className="whitespace-nowrap">
                      {thicknessLabel(group.thicknessMm)}
                      <span className="ml-1.5 text-neutral-400">
                        · {group.members.length} {groupWord}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                        usageBadgeClass(avgUsage)
                      )}
                    >
                      {avgUsage.toFixed(0)}%
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  floatingClassName="w-64 border-white/10 bg-[#141416]"
                  className="p-1.5 text-neutral-100"
                >
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    {thicknessLabel(group.thicknessMm)} · {group.members.length} {groupWord} de plancha
                  </div>
                  <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                    {group.members.map(({ index, item }) => {
                      const isActive = index === activeIndex
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => onChange(index)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                            isActive
                              ? "bg-white/10 text-white"
                              : "text-neutral-300 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="truncate font-medium">{item.label}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                              usageBadgeClass(item.usagePercent)
                            )}
                          >
                            {item.usagePercent.toFixed(0)}%
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )
          })}
        </div>
      </div>
    </div>
  )
}
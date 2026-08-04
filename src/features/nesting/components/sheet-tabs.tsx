"use client"

import { cn } from "@/shared/utils/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface SheetTabItem {
  key: string
  label: string
  usagePercent: number
}

export interface SheetTabsProps {
  items: SheetTabItem[]
  activeIndex: number
  onChange: (index: number) => void
}

function usageBadgeClass(percent: number): string {
  if (percent >= 70) return "bg-emerald-500/15 text-emerald-400"
  if (percent >= 40) return "bg-amber-500/15 text-amber-400"
  return "bg-rose-500/15 text-rose-400"
}

export function SheetTabs({ items, activeIndex, onChange }: SheetTabsProps) {
  if (items.length === 0) return null

  return (
    // Agregamos pb-3 para que el scrollbar flote en ese espacio inferior y no muerda el botón
    <ScrollArea className="w-full rounded-lg bg-white/5 p-1 pb-3 select-none">
      {/* Div escudo para absorber el !block y !w-fit del Viewport */}
      <div>
        <div className="flex w-max items-center gap-1">
          {items.map((item, i) => {
            const isActive = i === activeIndex
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange(i)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                  isActive
                    ? "bg-white/10 text-neutral-100 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300",
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
          })}
        </div>
      </div>
    </ScrollArea>
  )
}
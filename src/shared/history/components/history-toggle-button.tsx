"use client"

import { History } from "lucide-react"

import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"
import { cn } from "@/shared/utils/utils"

type Props = {
  count: number
  active: boolean
  onClick: () => void
}

export function HistoryToggleButton({ count, active, onClick }: Props) {
  return (
    <FabTrigger
      icon={History}
      label="HISTORIAL"
      active={active}
      onClick={onClick}
      badge={
        count > 0 ? (
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold select-none transition-colors duration-200",
            // Invertido respecto al FAB (bg-foreground): legible en light y dark
            "bg-background text-foreground shadow-sm ring-1 ring-border",
            active && "animate-history-bounce ring-2 ring-primary/40",
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
        ) : undefined
      }
    />
  )
}
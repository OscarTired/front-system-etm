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
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold select-none transition-colors duration-200",
            active
              ? "animate-history-bounce bg-emerald-600 text-white shadow-lg dark:bg-emerald-500 dark:text-emerald-950"
              : "bg-foreground/5 text-foreground/70",
          )}
        >
          {count}
        </span>
      }
    />
  )
}
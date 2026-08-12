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
              ? "animate-history-bounce bg-emerald-500/90 text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "bg-white/6 text-white/70",
          )}
        >
          {count}
        </span>
      }
    />
  )
}
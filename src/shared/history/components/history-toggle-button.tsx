"use client"

import {
  History,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

type Props = {
  count: number
  active: boolean
  onClick: () => void
}

export function HistoryToggleButton({
  count,
  active,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex"
    >
      <div
        className={cn(
          "flex h-8 items-center gap-2 rounded-xl px-2 text-white transition-colors",
          active
            ? "bg-white/10"
            : "hover:bg-white/5"
        )}
      >
        <History
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />

        <span className="whitespace-nowrap text-xs font-semibold select-none uppercase tracking-[0.08em]">
          HISTORIAL
        </span>

        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-bold select-none transition-colors duration-200",
            active
              ? "animate-history-bounce bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : "bg-white/6 text-white/70"
          )}
        >
          {count}
        </span>
      </div>
    </button>
  )
}
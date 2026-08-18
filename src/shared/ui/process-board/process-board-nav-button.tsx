"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  direction: "left" | "right"
  visible: boolean
  onClick: () => void
  label: string
}

/** Flecha al costado del track — no overlay, sin delay de hover. */
export function ProcessBoardNavButton({
  direction,
  visible,
  onClick,
  label,
}: Props) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      disabled={!visible}
      className={cn(
        "flex h-9 w-8 shrink-0 items-center justify-center self-center",
        "rounded-lg border border-border/60 bg-card text-foreground",
        "transition-opacity duration-150",
        "disabled:pointer-events-none",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
    </button>
  )
}

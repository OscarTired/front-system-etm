"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  direction: "left" | "right"
  visible: boolean
  onClick: () => void
  label: string
}

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
      tabIndex={-1}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      className={cn(
        "absolute top-5.5 z-20 -translate-y-1/2",
        direction === "left" ? "left-2" : "right-2",
        "flex h-7 w-8 items-center justify-center",
        "rounded-lg border border-border/60 bg-card/80 text-foreground backdrop-blur-xl",
        "transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Icon size={13} strokeWidth={2.5} />
    </button>
  )
}

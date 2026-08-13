"use client"

import { X } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  expanded: boolean
  onCollapse: () => void
  collapsed: React.ReactNode
  children: React.ReactNode
  showCollapseButton?: boolean
}

/** X sobre glass de dominio — tokens on-glass, no muted del tema de página. */
export function CollapseIndicatorsButton({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ocultar indicadores"
      className={cn(
        "absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full",
        "text-on-glass-muted transition-colors duration-150",
        "hover:bg-on-glass-foreground/10 hover:text-on-glass-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-glass-foreground/30",
        className,
      )}
    >
      <X size={16} strokeWidth={2} />
    </button>
  )
}

export function CollapsibleSummaryPanel({
  expanded,
  onCollapse,
  collapsed,
  children,
  showCollapseButton = true,
}: Props) {
  return (
    <div className="w-full min-w-0">
      {!expanded ? (
        <div className="w-full min-w-0 animate-comment-in">
          {collapsed}
        </div>
      ) : (
        <div className="relative w-full min-w-0 animate-comment-in">
          {showCollapseButton && (
            <CollapseIndicatorsButton onClick={onCollapse} />
          )}
          <div className="w-full min-w-0">{children}</div>
        </div>
      )}
    </div>
  )
}

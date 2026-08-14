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

/** Cerrar indicadores — ink on-glass, no muted de página. */
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
        "flex size-8 shrink-0 items-center justify-center rounded-full",
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
        <div className="flex w-full min-w-0 animate-comment-in flex-col gap-1.5">
          {/* Fila propia: no absolute sobre la última KPI card */}
          {showCollapseButton && (
            <div className="flex w-full justify-end pr-0.5">
              <CollapseIndicatorsButton onClick={onCollapse} />
            </div>
          )}
          <div className="w-full min-w-0">{children}</div>
        </div>
      )}
    </div>
  )
}

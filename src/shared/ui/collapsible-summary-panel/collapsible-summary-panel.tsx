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

/** X estilo DialogClose — dentro del carousel expandido. */
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
        "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
        className,
      )}
    >
      <X size={16} />
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

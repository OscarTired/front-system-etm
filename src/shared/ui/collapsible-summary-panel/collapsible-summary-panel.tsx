"use client"

import { ChevronUp } from "lucide-react"

import { cn } from "@/shared/utils/utils"

type Props = {
  expanded: boolean
  onCollapse: () => void
  collapsed: React.ReactNode
  children: React.ReactNode
  /** Si false, el caller renderiza el control (ej. al lado del EntityExpandedToggle). */
  showCollapseButton?: boolean
}

/** Mismo lenguaje visual que una opción de EntityExpandedToggle. */
export function CollapseIndicatorsButton({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg bg-white/5 p-1 select-none",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-wide text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <ChevronUp size={13} strokeWidth={2.5} className="shrink-0" />
        <span className="whitespace-nowrap">Ocultar</span>
      </button>
    </div>
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
        <div className="flex w-full min-w-0 flex-col animate-comment-in">
          {showCollapseButton && (
            <div className="mb-2 flex w-full justify-end px-1">
              <CollapseIndicatorsButton onClick={onCollapse} />
            </div>
          )}

          <div className="w-full min-w-0">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

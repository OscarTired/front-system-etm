"use client"

import type { ReactNode } from "react"

import { cn } from "@/shared/utils/utils"

type Props = {
  header: ReactNode
  children: ReactNode
  /** Entre header y lista (operarios, badges, etc.). */
  meta?: ReactNode
  className?: string
}

/**
 * Columna de ProcessBoard.
 *
 * Contrato (no romper):
 * - root: h-full min-h-0 flex-col
 * - header / meta: shrink-0
 * - body: flex-1 min-h-0 overflow-y-auto  ← único dueño del scroll Y
 */
export function ProcessBoardColumnFrame({
  header,
  meta,
  children,
  className,
}: Props) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <div className="shrink-0">{header}</div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}

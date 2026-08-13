"use client"

import type { ReactNode } from "react"

import { cn } from "@/shared/utils/utils"

type Props = {
  left?: ReactNode
  right?: ReactNode
  className?: string
}

/**
 * Altura fija: los chips de filtro no deben empujar el listado
 * unos px al montarse (antes min-h + py crecía con el badge).
 */
export function EntityToolbar({ left, right, className }: Props) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between tablet:h-15",
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden">
        {left}
      </div>
      <div className="flex shrink-0 items-center">{right}</div>
    </div>
  )
}

/**
 * Primer hijo dentro de AppListScroll en mobile:
 * sticky bajo el TopBar + blur mientras el listado scrollea detrás.
 */
export function EntityToolbarChrome({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        max-md:sticky max-md:top-14 max-md:z-10
        max-md:bg-background/80 max-md:backdrop-blur-xl
        max-md:supports-backdrop-filter:bg-background/55
      "
    >
      {children}
    </div>
  )
}

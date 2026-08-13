"use client"

import type { ReactNode } from "react"

import { cn } from "@/shared/utils/utils"

type Props = {
  left?: ReactNode
  right?: ReactNode
  className?: string
}

/**
 * Toolbar de entidad.
 * Padding vertical/horizontal reserva aire para sombras de chips
 * (el scroller padre tiene overflow y si no hay padding, las corta).
 * min-height + wrap: crece y empuja la lista, no se superpone.
 */
export function EntityToolbar({ left, right, className }: Props) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5",
        // Aire para shadow-sm de DynamicBadge / botones (no clip por overflow del scroll)
        "px-0.5 py-2",
        "overflow-visible",
        "tablet:min-h-12",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 overflow-visible">
        {left}
      </div>
      {right != null && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 overflow-visible">
          {right}
        </div>
      )}
    </div>
  )
}

export function EntityToolbarChrome({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        max-md:sticky max-md:top-14 max-md:z-10
        max-md:bg-background/80 max-md:backdrop-blur-xl
        max-md:supports-backdrop-filter:bg-background/55
        overflow-visible
      "
    >
      {children}
    </div>
  )
}

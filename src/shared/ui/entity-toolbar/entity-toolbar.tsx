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
 *
 * Sombras de chips: un ancestro con overflow-x auto/hidden recorta
 * box-shadow (en CSS overflow-x ≠ visible fuerza overflow-y ≠ visible).
 * Por eso acá y en FilterBar chips → overflow-visible + flex-wrap;
 * el padding solo ayuda si el clip ya no existe en el padre directo.
 */
export function EntityToolbar({ left, right, className }: Props) {
  return (
    <div
      className={cn(
        "flex min-h-15 w-full shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5",
        "px-1 py-2.5",
        "overflow-visible",
        "tablet:min-h-14",
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

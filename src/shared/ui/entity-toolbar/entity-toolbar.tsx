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
 * - min-height, NO height fijo: si los chips hacen wrap al achicar,
 *   crece y empuja la lista (nunca se superpone).
 * - overflow visible solo en ejes que no recortan sombra; el flujo
 *   normal del documento reserva el espacio vertical.
 */
export function EntityToolbar({ left, right, className }: Props) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5 overflow-visible py-0.5 tablet:min-h-12",
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
        overflow-visible
      "
    >
      {children}
    </div>
  )
}

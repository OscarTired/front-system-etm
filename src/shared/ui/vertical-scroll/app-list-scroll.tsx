"use client"

import { usePathname } from "next/navigation"

import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

type Props = {
  children: React.ReactNode
  /** Default: pathname (reset al navegar). */
  resetKey?: string
  /** Clases del viewport scrolleable (padding, etc.). */
  className?: string
  arrowTopOffset?: number
  arrowBottomOffset?: number
}

/**
 * Única superficie de scroll vertical de listas de la app (modelo B).
 * Shell no scrollea. Sin pull-to-refresh custom.
 */
export function AppListScroll({
  children,
  resetKey,
  className,
  arrowTopOffset = 10,
  arrowBottomOffset = 10,
}: Props) {
  const pathname = usePathname()

  return (
    <VerticalScroll
      resetKey={resetKey ?? pathname}
      containerClassName="min-h-0 flex-1"
      className={className ?? "overflow-x-hidden"}
      arrowTopOffset={arrowTopOffset}
      arrowBottomOffset={arrowBottomOffset}
    >
      {children}
    </VerticalScroll>
  )
}

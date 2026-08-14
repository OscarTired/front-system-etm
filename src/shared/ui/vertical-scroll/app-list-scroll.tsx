"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/shared/utils/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import {
  TOP_BAR_HEIGHT_PX,
  BOTTOM_NAV_HEIGHT_PX,
  PAGE_SEARCH_BAR_HEIGHT_PX,
} from "@/shared/responsive/layout/chrome-constants"
import { PullToRefresh } from "@/shared/ui/pull-to-refresh/pull-to-refresh"
import { usePageSearchStore } from "@/shared/ui/entity-toolbar/page-search-store"

type Props = {
  children: React.ReactNode
  resetKey?: string
  className?: string
  /** Pull-to-refresh (móvil). Si no se pasa, no hay PTR. */
  onRefresh?: () => void | Promise<void>
}

/**
 * Un scroller por superficie de lista.
 * Contenido: `h-full` (NO min-h-full) — le da al flex column una
 * altura DEFINIDA, así flex-1 en un hijo puntual (ej. Agenda/Mes en
 * Bitácora) tiene presupuesto real para repartir y puede llenar el
 * espacio disponible. Con min-h-full esto no funciona: min-height
 * no cuenta como altura definida para el algoritmo de flexbox, y
 * el flex-1 del hijo no hace nada. Si el contenido total supera esa
 * altura, igual desborda hacia el ScrollArea (que es quien de
 * verdad scrollea) porque este div no tiene overflow propio.
 */
export function AppListScroll({
  children,
  resetKey,
  className,
  onRefresh,
}: Props) {
  const pathname = usePathname()
  const key = resetKey ?? pathname
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsive()
  const searchOpen = usePageSearchStore(s => s.open && s.enabled)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [key])

  const content = (
    <div
      className={cn("flex h-full flex-col", className)}
      style={
        isMobile
          ? {
              paddingTop:
                TOP_BAR_HEIGHT_PX +
                (searchOpen ? PAGE_SEARCH_BAR_HEIGHT_PX : 0),
              paddingBottom: `calc(${BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`,
            }
          : undefined
      }
    >
      {children}
    </div>
  )

  return (
    <ScrollArea ref={scrollRef} className="h-full min-h-0 min-w-0 flex-1">
      {onRefresh && isMobile ? (
        <PullToRefresh scrollRef={scrollRef} onRefresh={onRefresh}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}
    </ScrollArea>
  )
}
"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/shared/utils/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import {
  TOP_BAR_HEIGHT_PX,
  BOTTOM_NAV_HEIGHT_PX,
} from "@/shared/responsive/layout/chrome-constants"

type Props = {
  children: React.ReactNode
  resetKey?: string
  className?: string
}

/**
 * Única superficie de scroll de listas.
 * Motor: ScrollArea nativo.
 * Padding mobile: TOP_BAR_HEIGHT_PX / BOTTOM_NAV_HEIGHT_PX
 * (misma fuente que TopBar / BottomNav — no pt-14/pb-20 a mano).
 *
 * Contrato de altura: el wrapper interno es SIEMPRE `flex min-h-full
 * flex-col` (min-h-full resuelve contra el propio ScrollArea, que sí
 * tiene altura real vía h-full/flex-1). Esto es lo que permite que
 * un hijo puntual (ej. una vista de agenda/mes) pida `flex-1` y
 * ocupe el espacio restante entre el toolbar y el padding inferior,
 * en vez de que cada vista reinvente su propio hack de altura
 * (minHeight: "100%" sin contexto, divs sin altura, etc). Listas
 * simples (día, roles, usuarios) no se ven afectadas: sin flex-1,
 * un hijo de flex-col se apila igual que en flujo normal.
 */
export function AppListScroll({ children, resetKey, className }: Props) {
  const pathname = usePathname()
  const key = resetKey ?? pathname
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsive()

  useEffect(() => {
    // Scroller = el propio ScrollArea (div nativo), no viewport Radix.
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [key])

  return (
    <ScrollArea ref={scrollRef} className="h-full min-h-0 min-w-0 flex-1">
      <div
        className={cn("flex min-h-full flex-col", className)}
        style={
          isMobile
            ? {
                paddingTop: TOP_BAR_HEIGHT_PX,
                paddingBottom: `calc(${BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </ScrollArea>
  )
}
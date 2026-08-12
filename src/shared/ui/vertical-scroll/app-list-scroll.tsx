"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

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

export function AppListScroll({ children, resetKey, className }: Props) {
  const pathname = usePathname()
  const key = resetKey ?? pathname
  const rootRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsive()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const viewport = root.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]",
    )
    if (viewport) viewport.scrollTop = 0
  }, [key])

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <ScrollArea className="h-full min-h-0 flex-1">
        {/*
          En mobile, el TopBar/BottomNav son overlays flotantes (ver
          app-shell.tsx) — el slot de contenido es pantalla completa
          para que el contenido pueda pasar por detrás al scrollear
          (efecto vidrio). Sin este padding, el contenido en reposo
          arrancaría en el mismo punto que el TopBar (tapado), en vez
          de arrancar debajo. Con nombre (TOP_BAR_HEIGHT_PX), no un
          número suelto — y solo en mobile: en desktop el TopBar es
          flujo normal, no hace falta compensar nada.
        */}
        <div
          className={className}
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
    </div>
  )
}
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

/**
 * Única superficie de scroll de listas.
 * Motor: ScrollArea nativo.
 * Padding mobile: TOP_BAR_HEIGHT_PX / BOTTOM_NAV_HEIGHT_PX
 * (misma fuente que TopBar / BottomNav — no pt-14/pb-20 a mano).
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
  )
}

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

export function AppListScroll({ children, resetKey, className }: Props) {
  const pathname = usePathname()
  const key = resetKey ?? pathname
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsive()

  useEffect(() => {

    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [key])

  return (
    <ScrollArea ref={scrollRef} className="h-full min-h-0 min-w-0 flex-1">
      <div
        className={cn("flex h-full flex-col", className)}
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
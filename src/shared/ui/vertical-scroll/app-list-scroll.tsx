"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"

type Props = {
  children: React.ReactNode
  resetKey?: string
  className?: string
}

export function AppListScroll({ children, resetKey, className }: Props) {
  const pathname = usePathname()
  const key = resetKey ?? pathname
  const rootRef = useRef<HTMLDivElement>(null)

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
        <div
          className={cn(
            "max-md:pt-14 max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]",
            className,
          )}
        >
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}

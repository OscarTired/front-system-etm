"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
  children: React.ReactNode
  /** Default: pathname (reset al navegar). */
  resetKey?: string
  /** Clases del viewport scrolleable (padding, etc.). */
  className?: string
}

export function AppListScroll({
  children,
  resetKey,
  className,
}: Props) {
  const pathname = usePathname()
  const key = resetKey ?? pathname

  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = viewportRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    )
    if (viewport) viewport.scrollTop = 0
  }, [key])

  return (
    <div ref={viewportRef} className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className={className}>
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}
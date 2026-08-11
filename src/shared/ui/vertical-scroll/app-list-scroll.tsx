"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"

type Props = {
  children: React.ReactNode
  /** Al cambiar, scrollTop = 0. Default: pathname. */
  resetKey?: string
  /** Padding del contenido (no del Root). */
  className?: string
}

/**
 * Listas de página. Único dueño de overflow bajo el shell.
 *
 * Cadena:
 *   shell (overflow-hidden, altura fija)
 *     page (h-full min-h-0 flex-col)
 *       toolbar shrink-0
 *       AppListScroll (flex-1 min-h-0) → Radix ScrollArea
 */
export function AppListScroll({
  children,
  resetKey,
  className,
}: Props) {
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
        {/*
          Mobile: padding para que el primer/último ítem queden legibles
          bajo TopBar (h-14) y BottomNav (~5rem), pero el scroll pasa
          DETRÁS del chrome con blur — no se recorta el viewport.
        */}
        <div
          className={cn(
            // Solo bottom: el top lo da el shell al page root (toolbar
            // + lista). Así no hay doble pt bajo EntityToolbar.
            "max-md:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]",
            className,
          )}
        >
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}

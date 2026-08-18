"use client"

import type { PropsWithChildren } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"

type Props = PropsWithChildren<{ className?: string }>

/** Fila horizontal — solo scroll nativo (sin drag a mano). */
export function HorizontalScroll({ children, className }: Props) {
  return (
    <ScrollArea orientation="horizontal" className="h-full min-h-0 w-full">
      <div
        className={cn("flex h-full min-h-0 w-max items-start gap-3", className)}
      >
        {children}
      </div>
    </ScrollArea>
  )
}

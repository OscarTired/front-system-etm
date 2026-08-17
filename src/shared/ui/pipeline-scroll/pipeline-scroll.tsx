"use client"

import type { PropsWithChildren } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"

type Props = PropsWithChildren<{ className?: string }>

export function PipelineScroll({ children, className }: Props) {
  return (
    <ScrollArea
      orientation="horizontal"
      dragToScroll
      className="h-full min-h-0 w-full"
    >
      <div className={cn("flex h-full w-max items-start gap-4", className)}>
        {children}
      </div>
    </ScrollArea>
  )
}

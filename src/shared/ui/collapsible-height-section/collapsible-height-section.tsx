"use client"

import { useState } from "react"
import { cn } from "@/shared/utils/utils"

type Props = {
  open: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleHeightSection({
  open,
  children,
  className,
}: Props) {
  // Mantenemos el estado de montaje para desmontar cuando esté cerrado si es necesario, 
  // o dejamos que el grid colapse a 0.
  const [mounted, setMounted] = useState(open)

  if (open && !mounted) {
    setMounted(true)
  }

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden min-h-0">
        <div className={cn("transition-opacity duration-200 ease-out", open ? "opacity-100 delay-75" : "opacity-0", className)}>
          {children}
        </div>
      </div>
    </div>
  )
}
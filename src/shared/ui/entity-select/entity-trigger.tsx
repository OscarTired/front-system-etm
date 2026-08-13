"use client"

import {
  ChevronDown,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

type EntityTriggerProps = {
  open: boolean
  children: React.ReactNode
}

export function EntityTrigger({
  open,
  children,
}: EntityTriggerProps) {

  return (

    <div className="flex w-full items-center gap-3">

      {children}

      <ChevronDown
        size={14}
        className={cn(
          "text-muted-foreground transition-transform",
          open && "rotate-180"
        )}
      />

    </div>

  )

}
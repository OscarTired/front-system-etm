"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    /** vertical (default) | horizontal | both */
    orientation?: "vertical" | "horizontal" | "both"
  }
>(({ className, orientation = "vertical", children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="scroll-area"
    className={cn(
      "native-scrollbar min-h-0 min-w-0",
      orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
      orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
      orientation === "both" && "overflow-auto",
      className,
    )}
    {...props}
  >
    {children}
  </div>
))
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
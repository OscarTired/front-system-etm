"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Props = React.ComponentPropsWithoutRef<"div"> & {
  orientation?: "vertical" | "horizontal" | "both"
  /** false = thumb oculto (default pages). true = .native-scrollbar */
  showScrollbar?: boolean
}

const ScrollArea = React.forwardRef<HTMLDivElement, Props>(
  (
    { className, orientation = "vertical", showScrollbar = false, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="scroll-area"
      className={cn(
        "min-h-0 min-w-0 overscroll-y-contain overscroll-x-contain",
        orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
        orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
        orientation === "both" && "overflow-auto",
        showScrollbar
          ? "native-scrollbar"
          : "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  ),
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }

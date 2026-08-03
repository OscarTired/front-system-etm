"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  scrollHideDelay = 1000,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  scrollHideDelay?: number
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type="scroll"
      scrollHideDelay={scrollHideDelay}
      className={cn("relative overflow-hidden h-full w-full", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "absolute flex touch-none select-none transition-opacity duration-200 ease-out p-1",
        "data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none",
        "data-[state=visible]:opacity-100",

        orientation === "vertical" &&
          "h-[calc(100%-8px)] w-3 right-1 top-1 bottom-1",
        orientation === "horizontal" &&
          "w-[calc(100%-8px)] h-3 bottom-1 left-1 right-1",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        // Cambiado a w-full para ocupar el ancho del contenedor y aumentado el grosor visual
        className={cn(
          "relative flex-1 rounded-full bg-neutral-600/70 transition-colors duration-200 hover:bg-neutral-500/90 active:bg-neutral-400",
          orientation === "vertical" && "w-full min-h-10",
          orientation === "horizontal" && "h-full min-w-10"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
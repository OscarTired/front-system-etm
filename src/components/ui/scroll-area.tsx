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
      type="scroll" // Mantiene el scroll visible si hay desbordamiento
      scrollHideDelay={scrollHideDelay}
      className={cn("relative overflow-hidden h-full w-full", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        /* 
          EL CAMBIO CLAVE ESTÁ AQUÍ AL FINAL: 
          Quitamos [&>div]:!w-full y ponemos [&>div]:!w-fit [&>div]:!min-w-full 
        */
        className="size-full min-w-full w-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 [&>div]:!block [&>div]:!w-fit [&>div]:!min-w-full"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
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
          "h-[calc(100%-25px)] w-3 right-1 mt-1 mb-4",
        orientation === "horizontal" &&
          "w-[calc(100%-32px)] h-3 bottom-1 left-4 right-4",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative flex-1 rounded-full bg-neutral-600/70 transition-colors duration-200 hover:bg-neutral-500/90 active:bg-neutral-400",
          orientation === "vertical" && "w-full min-h-8",
          orientation === "horizontal" && "h-full min-w-8"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
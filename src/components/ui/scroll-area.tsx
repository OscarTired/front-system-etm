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
      className={cn("relative overflow-hidden", className)}
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
        // Duración reducida a 200ms para que reaccione al instante sin sentirse lento
        "absolute flex touch-none select-none transition-opacity duration-200 ease-out p-0.5",
        // Desaparición limpia y rápida sin escalas pesadas
        "data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none",
        "data-[state=visible]:opacity-100",
        // Dimensiones exactas según orientación (ancho controlado a 2 (8px))
        orientation === "vertical" &&
          "h-full w-2 right-0 top-0 bottom-0",
        orientation === "horizontal" &&
          "w-full h-2 bottom-0 left-0 right-0",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        // Eliminado el transition-all pesado. Solo animamos colores para máxima agilidad visual.
        className={cn(
          "relative flex-1 rounded-full bg-neutral-600/60 transition-colors duration-200 hover:bg-neutral-500/90 active:bg-neutral-400",
          orientation === "vertical" && "w-full min-h-10",
          orientation === "horizontal" && "h-full min-w-10"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
 
export { ScrollArea, ScrollBar }
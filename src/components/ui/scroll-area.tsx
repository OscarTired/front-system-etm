"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  scrollHideDelay = 1000, // Aumentamos el tiempo de espera por defecto (1 segundo) para que no desaparezca rápido
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  scrollHideDelay?: number
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type="hover"
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
        // Transición fluida general para el contenedor del scrollbar
        "absolute flex touch-none select-none transition-all duration-500 ease-out p-0.5",
        // Desaparición con un desvanecimiento más suave
        "data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none data-[state=hidden]:scale-95",
        "data-[state=visible]:opacity-100 data-[state=visible]:scale-100",
        // Dimensiones exactas según orientación
        orientation === "vertical" &&
          "h-full w-2.5 right-0 top-0 bottom-0",
        orientation === "horizontal" &&
          "w-full h-2.5 bottom-0 left-0 right-0",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        // Efecto "serpiente": transition-all permite que tanto el alto/ancho como el color se estiren de forma elástica
        className={cn(
          "relative flex-1 rounded-full bg-neutral-600/60 transition-all duration-500 ease-in-out hover:bg-neutral-500/90 active:bg-neutral-400",
          orientation === "vertical" && "w-full min-h-10",
          orientation === "horizontal" && "h-full min-w-10"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
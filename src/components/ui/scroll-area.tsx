"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * Scroll vertical del design system — @radix-ui/react-scroll-area.
 *
 * Contrato:
 * - El PADRE acota alto y ancho (min-h-0, flex-1 | h-full | max-h-*, min-w-0, w-full | max-w-*).
 * - Este Root llena ese hueco.
 * - Los HIJOS se adaptan: min-w-0 w-full + truncate en texto flexible.
 * - type="scroll": thumb visible al scrollear.
 * - Features no usan overflow-y-auto manual para listas/paneles.
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, type = "scroll", ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    type={type}
    data-slot="scroll-area"
    className={cn(
      "relative h-full min-h-0 w-full min-w-0 overflow-hidden",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      className="h-full max-h-full w-full max-w-full min-w-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&>div]:!block [&>div]:min-w-0"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    data-slot="scroll-area-scrollbar"
    orientation={orientation}
    className={cn(
      "z-20 flex touch-none select-none p-px transition-colors",
      orientation === "vertical" &&
        "h-full w-2 border-l border-l-transparent",
      orientation === "horizontal" &&
        "h-2 flex-col border-t border-t-transparent",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      data-slot="scroll-area-thumb"
      className="relative flex-1 rounded-full bg-white/25 hover:bg-white/40"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
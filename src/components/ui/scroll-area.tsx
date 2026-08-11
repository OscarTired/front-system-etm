"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * Scroll vertical del design system — @radix-ui/react-scroll-area.
 *
 * Contrato de altura (obligatorio para que el thumb trackee):
 * - Padre acota alto: min-h-0 + (flex-1 | h-full | max-h-*)
 * - Root es overflow-hidden y llena ese alto
 * - Viewport es size-full y scrollea por dentro
 *
 * type default "scroll": barra visible al scrollear (desktop + touch).
 * No uses overflow-y-auto manual en features; usá este componente.
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, type = "scroll", ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    type={type}
    data-slot="scroll-area"
    className={cn("relative h-full min-h-0 overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      className="h-full max-h-full w-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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

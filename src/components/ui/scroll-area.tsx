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
      // Por debajo de tablet, sin thumb visible — mismo criterio
      // que cualquier app nativa en mobile (el scroll se siente por
      // el movimiento del contenido, no por una barra persistente).
      // max-tablet: es la variante real de Tailwind, resuelta desde
      // --breakpoint-tablet (la misma fuente que usa useResponsive
      // para isMobile) — no una media query ni un número aparte.
      "max-tablet:[scrollbar-width:none] max-tablet:[&::-webkit-scrollbar]:hidden",
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
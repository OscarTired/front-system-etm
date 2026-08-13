"use client"

import * as React from "react"
import { cn } from "@/shared/utils/utils"

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(
  ({ className, onFocus, ...props }, ref) => (
    <input
      ref={ref}
      onFocus={event => {
        const input = event.currentTarget

        requestAnimationFrame(() => {
          try {
            const length = input.value.length
            input.setSelectionRange(length, length)
          } catch {}
        })

        onFocus?.(event)
      }}
      className={cn(
        "h-10 w-full min-w-0 rounded-xl px-4",

        "border border-transparent",
        
        "bg-foreground/5",

        "text-sm font-medium text-foreground placeholder:text-muted-foreground/80",

        "outline-none focus:outline-none focus:ring-0",

        "focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none",

        "disabled:cursor-not-allowed disabled:opacity-50",

        className
      )}
      {...props}
    />
  )
)

Input.displayName = "Input"
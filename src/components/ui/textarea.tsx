"use client"

import * as React from "react"

import {
  cn,
} from "@/shared/utils/utils"

type TextareaProps =
  React.ComponentProps<"textarea">

export const Textarea =
  React.forwardRef<
    HTMLTextAreaElement,
    TextareaProps
  >(
    (
      {
        className,
        ...props
      },
      ref
    ) => (

      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "min-h-24",
          "w-full",
          "rounded-xl",
          "border border-transparent",
          "bg-foreground/5",
          "px-4 py-3",
          "text-sm font-medium text-foreground",
          "placeholder:text-muted-foreground/80",
          "outline-none",
          "transition-all duration-200",
          "resize-none",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          "aria-invalid:border-red-500/30",
          "aria-invalid:bg-red-500/5",

          className
        )}
        {...props}
      />

    )
  )

Textarea.displayName =
  "Textarea"
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/shared/utils/utils"

import { PopoverModeContext } from "./contexts"

type PopoverAnchorProps = React.ComponentProps<typeof PopoverPrimitive.Anchor>

export function PopoverAnchor({
  asChild,
  children,
  ...props
}: PopoverAnchorProps) {
  const isSheet = React.useContext(PopoverModeContext)

  if (isSheet) {
    if (asChild && React.isValidElement(children)) {
      return children
    }
    return <span {...props}>{children}</span>
  }

  return (
    <PopoverPrimitive.Anchor
      data-slot="popover-anchor"
      asChild={asChild}
      {...props}
    >
      {children}
    </PopoverPrimitive.Anchor>
  )
}

export function PopoverHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  )
}

export function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

export function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

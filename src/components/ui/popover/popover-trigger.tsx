"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Drawer } from "vaul"

import { PopoverModeContext } from "./contexts"

type PopoverTriggerProps = React.ComponentProps<typeof PopoverPrimitive.Trigger>

function isNestedFormControl(
  target: EventTarget | null,
  currentTarget: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target === currentTarget) return false
  const tag = target.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  )
}

export function PopoverTrigger({
  className,
  onClick,
  ...props
}: PopoverTriggerProps) {
  const isSheet = React.useContext(PopoverModeContext)

  const guardedOnClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (isNestedFormControl(event.target, event.currentTarget)) {
        event.preventDefault()
      }
      onClick?.(event as React.MouseEvent<HTMLButtonElement>)
    },
    [onClick],
  )

  if (isSheet) {
    return (
      <Drawer.Trigger
        data-slot="popover-trigger"
        className={className}
        onClick={guardedOnClick}
        {...props}
      />
    )
  }

  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={className}
      onClick={guardedOnClick}
      {...props}
    />
  )
}

"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { cn } from "@/shared/utils/utils"

import {
  PopoverCloseContext,
  PopoverModeContext,
  PopoverOpenContext,
} from "./contexts"
import { SHEET_CONFIG } from "./sheet-config"
import { useSheetDragToDismiss } from "./use-sheet-drag-to-dismiss"
import { useSmoothResize } from "./use-smooth-resize"
import { useVirtualKeyboardOpen } from "./use-virtual-keyboard-open"

type PopoverContentProps = React.ComponentProps<
  typeof PopoverPrimitive.Content
> & {
  portal?: boolean
  floatingClassName?: string
}

/**
 * Desktop → Popover flotante
 * Mobile  → Bottom sheet (Dialog)
 *
 * Contrato sheet
 * 1. Handle = único drag-to-dismiss
 * 2. Body = un overflow-y-auto + overscroll-contain
 * 3. Sin locks manuales de body/scroll-area
 * 4. Altura fija SOLO si input focused Y teclado virtual abierto
 *    (F12 sin teclado on-screen → hug content, no crece en vacío)
 */
export function PopoverContent({
  className,
  floatingClassName,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  avoidCollisions = true,
  collisionPadding = 12,
  portal = true,
  children,
  onPointerDownOutside,
  onInteractOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  style,
  ...props
}: PopoverContentProps) {
  const isSheet = React.useContext(PopoverModeContext)
  const close = React.useContext(PopoverCloseContext)
  const isOpen = React.useContext(PopoverOpenContext)

  const { dragY, isDragging, dismissing, dragHandleProps } =
    useSheetDragToDismiss(close, isOpen)

  const { containerRef, size } = useSmoothResize()
  const lastMeasuredHeightRef = React.useRef<number | null>(null)
  if (size.height != null && size.height > 0) {
    lastMeasuredHeightRef.current = size.height
  }
  const measuredHeight = size.height ?? lastMeasuredHeightRef.current

  const [isInputFocused, setIsInputFocused] = React.useState(false)
  const keyboardOpen = useVirtualKeyboardOpen()

  // Solo expandir cuando hay teclado real + foco (no F12 sin teclado visual)
  const expandForKeyboard = isInputFocused && keyboardOpen

  React.useEffect(() => {
    if (!isOpen) setIsInputFocused(false)
  }, [isOpen])

  if (isSheet) {
    const transitionStyle = isDragging
      ? "none"
      : dismissing
        ? `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_DISMISS}, opacity ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ease-in`
        : `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`

    const sheetHeight = expandForKeyboard
      ? `${SHEET_CONFIG.FIXED_HEIGHT_RATIO * 100}dvh`
      : measuredHeight != null
        ? `min(${measuredHeight + SHEET_CONFIG.CHROME_OVERHEAD_PX}px, ${SHEET_CONFIG.MAX_HEIGHT_RATIO * 100}dvh)`
        : `min(50dvh, ${SHEET_CONFIG.MAX_HEIGHT_RATIO * 100}dvh)`

    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 overscroll-contain bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:duration-250 data-[state=open]:duration-200",
          )}
        />

        <DialogPrimitive.Content
          data-slot="popover-sheet"
          data-drag-scroll-ignore
          onFocusCapture={event => {
            const t = event.target
            if (
              t instanceof HTMLInputElement ||
              t instanceof HTMLTextAreaElement
            ) {
              setIsInputFocused(true)
            }
          }}
          onBlurCapture={event => {
            const t = event.target
            if (
              t instanceof HTMLInputElement ||
              t instanceof HTMLTextAreaElement
            ) {
              requestAnimationFrame(() => {
                const active = document.activeElement
                if (
                  !(active instanceof HTMLInputElement) &&
                  !(active instanceof HTMLTextAreaElement)
                ) {
                  setIsInputFocused(false)
                }
              })
            }
          }}
          onOpenAutoFocus={event => {
            if (onOpenAutoFocus) onOpenAutoFocus(event)
            else event.preventDefault()
          }}
          onCloseAutoFocus={event => {
            onCloseAutoFocus?.(event)
          }}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden overscroll-contain",
            "rounded-t-2xl bg-popover text-popover-foreground shadow-2xl outline-none",
            "pb-[env(safe-area-inset-bottom,0px)]",
            "[touch-action:pan-y]",
            className,
          )}
          style={{
            ...style,
            height: sheetHeight,
            maxHeight: `${SHEET_CONFIG.MAX_HEIGHT_RATIO * 100}dvh`,
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            opacity: dismissing ? 0 : undefined,
            transition: transitionStyle,
          }}
          {...props}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Menú</DialogPrimitive.Title>
          </VisuallyHidden>

          <div
            className="flex shrink-0 touch-none cursor-grab flex-col items-center pb-1 pt-2.5 active:cursor-grabbing"
            {...dragHandleProps}
          >
            <div className="h-1 w-10 rounded-full bg-foreground/20" />
          </div>

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain",
              "[touch-action:pan-y]",
              "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
              "[&_input]:touch-manipulation [&_textarea]:touch-manipulation",
            )}
          >
            <div ref={containerRef} className="w-full">
              {children}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )
  }

  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      data-drag-scroll-ignore
      align={align}
      side={side}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={event => {
        if (onOpenAutoFocus) onOpenAutoFocus(event)
        else event.preventDefault()
      }}
      onCloseAutoFocus={event => {
        onCloseAutoFocus?.(event)
      }}
      onPointerDownOutside={onPointerDownOutside}
      onInteractOutside={onInteractOutside}
      onWheel={event => {
        const el = event.currentTarget
        if (el.scrollHeight > el.clientHeight) {
          event.stopPropagation()
        }
      }}
      onTouchMove={event => {
        event.stopPropagation()
      }}
      className={cn(
        "z-40 pointer-events-auto flex flex-col gap-2.5 overflow-hidden rounded-xl bg-popover p-2.5 text-sm text-popover-foreground shadow-xl outline-none",
        "transition-[width,height] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150",
        floatingClassName,
        className,
      )}
      style={{
        ...style,
        width: size.width ? `${size.width}px` : undefined,
        height: size.height ? `${size.height}px` : undefined,
      }}
      {...props}
    >
      <div
        ref={containerRef}
        className="flex h-full w-full flex-col gap-2.5 overflow-hidden"
      >
        {children}
      </div>
    </PopoverPrimitive.Content>
  )

  if (!portal) return content
  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
}

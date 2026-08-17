"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Drawer } from "vaul"

import { cn } from "@/shared/utils/utils"

import {
  PopoverCloseContext,
  PopoverModeContext,
  PopoverOpenContext,
} from "./contexts"
import { SHEET_CONFIG } from "./sheet-config"
import { useSmoothResize } from "./use-smooth-resize"
import { useVirtualKeyboardOpen } from "./use-virtual-keyboard-open"

type PopoverContentProps = React.ComponentProps<
  typeof PopoverPrimitive.Content
> & {
  portal?: boolean
  floatingClassName?: string
  /**
   * Solo sheet mobile: footer anclado al fondo del sheet
   * (fuera del scroll del body). Listo / acciones globales.
   */
  sheetFooter?: React.ReactNode
}

/**
 * Desktop → Popover flotante (Radix)
 * Mobile  → Bottom sheet (Vaul) — drag/dismiss estándar, no gesture casero
 *
 * Contrato sheet (Vaul)
 * 1. Handle + body: dismiss nativo (scrollTop≈0 lo resuelve Vaul)
 * 2. Body = overflow-y-auto + overscroll-contain
 * 3. Altura fija SOLO si input focused Y teclado virtual abierto
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
  sheetFooter,
  children,
  onPointerDownOutside,
  onInteractOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  style,
  ...props
}: PopoverContentProps) {
  const isSheet = React.useContext(PopoverModeContext)
  const isOpen = React.useContext(PopoverOpenContext)
  const close = React.useContext(PopoverCloseContext)

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
    const sheetHeight = expandForKeyboard
      ? `${SHEET_CONFIG.FIXED_HEIGHT_RATIO * 100}dvh`
      : measuredHeight != null
        ? `min(${measuredHeight + SHEET_CONFIG.CHROME_OVERHEAD_PX}px, ${SHEET_CONFIG.MAX_HEIGHT_RATIO * 100}dvh)`
        : undefined

    return (
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
            "pointer-events-auto cursor-default select-none",
            "data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0",
          )}
          onPointerDown={event => {
            // Evita ghost-click al shell bajo el portal
            event.preventDefault()
          }}
          onClick={() => {
            close()
          }}
        />

        <Drawer.Content
          data-slot="popover-sheet"
          data-drag-scroll-ignore
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 mt-16 flex flex-col overflow-hidden outline-none",
            "rounded-t-2xl bg-popover text-popover-foreground",
            "shadow-sm shadow-black/15 dark:shadow-black/40",
            "pb-[env(safe-area-inset-bottom,0px)]",
            className,
          )}
          style={{
            ...style,
            height: sheetHeight,
            maxHeight: `${SHEET_CONFIG.MAX_HEIGHT_RATIO * 100}dvh`,
          }}
        >
          <VisuallyHidden>
            <Drawer.Title>Menú</Drawer.Title>
          </VisuallyHidden>

          <div className="flex shrink-0 flex-col items-center pb-1 pt-2.5">
            <div className="h-1 w-10 rounded-full bg-foreground/20" />
          </div>

          <div
            data-sheet-scroll
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain",
              "[touch-action:pan-y]",
              "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
              "[&_input]:touch-manipulation [&_textarea]:touch-manipulation",
            )}
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
          >
            <div ref={containerRef} className="w-full">
              {children}
            </div>
          </div>

          {sheetFooter ? (
            <div className="shrink-0 border-t border-border/50 bg-popover px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              {sheetFooter}
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
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
        "z-40 pointer-events-auto flex flex-col gap-2.5 overflow-hidden rounded-xl bg-popover p-2.5 text-sm text-popover-foreground shadow-sm shadow-black/15 dark:shadow-black/40 outline-none",
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

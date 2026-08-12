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
import { useVisualViewportFrame } from "./use-visual-viewport-frame"

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  portal?: boolean
  floatingClassName?: string
}

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
  const vvFrame = useVisualViewportFrame()


  if (isSheet) {
    const transitionStyle: string = isDragging
      ? "none"
      : dismissing
        ? `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_DISMISS}, opacity ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ease-in`
        : `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`

    /**
     * Instagram pattern:
     * - bottom = keyboardInset  → sheet sentado sobre el teclado
     * - height = casi todo el VV → lista siempre visible
     * - body flex column + min-h-0 → el scroll vive DENTRO, no empuja el sheet
     * - sin height de ResizeObserver (rompía iOS midiendo solo el input)
     */
    const sheetMaxH = Math.max(
      200,
      vvFrame.height * (vvFrame.keyboardOpen ? 0.98 : SHEET_CONFIG.MAX_HEIGHT_RATIO),
    )
    // Con teclado: altura fija al VV. Nunca auto (colapsa al focus del buscador).
    const sheetHeight = vvFrame.keyboardOpen ? sheetMaxH : undefined

    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed z-40 bg-black/50 backdrop-blur-sm pointer-events-auto",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:duration-250 data-[state=open]:duration-200",
          )}
          style={{
            top: vvFrame.top,
            left: vvFrame.left,
            width: vvFrame.width || "100%",
            height: vvFrame.height || "100%",
          }}
        />

        <DialogPrimitive.Content
          data-slot="popover-sheet"
          data-drag-scroll-ignore
          data-keyboard-open={vvFrame.keyboardOpen ? "true" : "false"}
          onOpenAutoFocus={event => {
            if (onOpenAutoFocus) onOpenAutoFocus(event)
            else event.preventDefault()
          }}
          onCloseAutoFocus={event => {
            onCloseAutoFocus?.(event)
          }}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
          {...dragHandleProps}
          className={cn(
            // flex-col es el contrato IG: handle | body scrolleable
            "fixed z-40 flex flex-col overflow-hidden",
            "rounded-t-3xl bg-popover shadow-2xl outline-none select-none",
            !dismissing &&
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
            !dismissing &&
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            !dismissing &&
              "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
            !dismissing &&
              "data-[state=closed]:duration-250 data-[state=open]:duration-300",
          )}
          style={{
            ...style,
            top: "auto",
            right: "auto",
            left: vvFrame.left || 0,
            width: vvFrame.width ? vvFrame.width : "100%",
            // IG: el sheet “se sienta” arriba del teclado
            bottom: vvFrame.keyboardInset,
            maxHeight: sheetMaxH,
            height: sheetHeight ?? "auto",
            minHeight: vvFrame.keyboardOpen ? Math.min(sheetMaxH, 280) : undefined,
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: isDragging
              ? "none"
              : dismissing
                ? transitionStyle
                : `bottom 160ms cubic-bezier(0.2,0,0,1), height 160ms cubic-bezier(0.2,0,0,1), max-height 160ms cubic-bezier(0.2,0,0,1), transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`,
          }}
        >
          <VisuallyHidden asChild>
            <DialogPrimitive.Title>Opciones</DialogPrimitive.Title>
          </VisuallyHidden>

          <div className="flex w-full shrink-0 touch-none justify-center pb-1 pt-2.5">
            <div className="h-1.5 w-9 rounded-full bg-white/15" />
          </div>

          <div
            ref={containerRef}
            onWheel={event => {
              const el = event.currentTarget
              if (el.scrollHeight > el.clientHeight) event.stopPropagation()
            }}
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${SHEET_CONFIG.SAFE_AREA_BOTTOM_OFFSET_PX}px)`,
            }}
            className={cn(
              // min-h-0 + flex-1: el hijo (Command) puede scrollear
              "flex min-h-0 w-full flex-1 flex-col",
              "px-4 pt-1 text-sm",
              vvFrame.keyboardOpen ? "overflow-y-auto" : "overflow-hidden",
              className,
            )}
            {...props}
          >
            {children}
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
      onOpenAutoFocus={(event) => {
        if (onOpenAutoFocus) {
          onOpenAutoFocus(event)
        } else {
          event.preventDefault()
        }
      }}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event)
      }}
      onPointerDownOutside={onPointerDownOutside}
      onInteractOutside={onInteractOutside}
      onWheel={(event) => {
        const element = event.currentTarget
        const isScrollable = element.scrollHeight > element.clientHeight
        if (isScrollable) {
          event.stopPropagation()
        }
      }}
      onTouchMove={(event) => {
        event.stopPropagation()
      }}
      className={cn(
        "z-40 pointer-events-auto flex flex-col gap-2.5 rounded-xl bg-popover p-2.5 text-sm shadow-xl outline-none overflow-hidden",
        "transition-[width,height] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        // Animaciones limpias de aparición basadas puramente en opacidad (sin zoom tembloroso)
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150",
        floatingClassName,
        className
      )}
      style={{
        ...style,
        width: size.width ? `${size.width}px` : undefined,
        height: size.height ? `${size.height}px` : undefined,
      }}
      {...props}
    >
      <div ref={containerRef} className="flex flex-col gap-2.5 w-full h-full overflow-hidden">
        {children}
      </div>
    </PopoverPrimitive.Content>
  )

  if (!portal) {
    return content
  }

  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
}


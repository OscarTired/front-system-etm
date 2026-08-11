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
        : `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}, height 300ms cubic-bezier(0.2,0,0,1)`

    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:duration-250 data-[state=open]:duration-200"
          )}
        />

        <DialogPrimitive.Content
          data-slot="popover-sheet"
          data-drag-scroll-ignore
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
          {...dragHandleProps}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden",
            "rounded-t-3xl bg-popover shadow-2xl outline-none select-none",
            !dismissing && "data-[state=open]:animate-in data-[state=closed]:animate-out",
            !dismissing && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            !dismissing && "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
            !dismissing && "data-[state=closed]:duration-250 data-[state=open]:duration-300"
          )}
          style={{
            ...style,
            // Anclado al borde inferior del *visual* viewport.
            // Cuando abre el teclado, vv.height baja y bottom sube:
            // el sheet se queda siempre visible encima del teclado.
            top: "auto",
            right: "auto",
            left: vvFrame ? vvFrame.left : 0,
            width: vvFrame ? vvFrame.width : "100%",
            bottom: vvFrame
              ? Math.max(
                  0,
                  window.innerHeight - (vvFrame.top + vvFrame.height),
                )
              : 0,
            // Tope = casi todo el área visible (no el layout completo).
            maxHeight: vvFrame
              ? Math.max(160, vvFrame.height * SHEET_CONFIG.MAX_HEIGHT_RATIO)
              : "85dvh",
            height: "auto",
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: isDragging
              ? "none"
              : dismissing
                ? transitionStyle
                : `max-height 200ms cubic-bezier(0.2,0,0,1), bottom 200ms cubic-bezier(0.2,0,0,1), transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`,
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
            onWheel={(event) => {
              const element = event.currentTarget
              const isScrollable = element.scrollHeight > element.clientHeight
              if (isScrollable) {
                event.stopPropagation()
              }
            }}
            style={(() => {
              // Handle (~36px) + safe padding; el resto es área scrolleable.
              const handlePx = 36
              const safePad =
                SHEET_CONFIG.SAFE_AREA_BOTTOM_OFFSET_PX
              const vvCap = vvFrame
                ? Math.max(
                    120,
                    vvFrame.height * SHEET_CONFIG.MAX_HEIGHT_RATIO -
                      handlePx,
                  )
                : undefined
              // Contenido medido, pero NUNCA más alto que el viewport
              // visible: si no, el teclado recorta y el scroll interno
              // no recibe altura acotada (overflow del padre).
              const measured = size.height
              const heightPx =
                measured != null && vvCap != null
                  ? Math.min(measured, vvCap)
                  : measured != null
                    ? measured
                    : undefined
              return {
                paddingBottom: `calc(env(safe-area-inset-bottom) + ${safePad}px)`,
                height: heightPx != null ? `${heightPx}px` : "auto",
                maxHeight: vvCap != null ? `${vvCap}px` : undefined,
                // content-box: RO mide content-box; el padding no debe
                // comerse la altura del listado.
                boxSizing: "content-box" as const,
              }
            })()}
            className={cn(
              "flex min-h-0 w-full flex-col gap-2.5 overflow-hidden transition-[height,max-height] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
              "px-4 pt-1 text-sm",
              className
            )}
            {...props}
          >
            <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain">
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


"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

const SHEET_CONFIG = {
  DISMISS_THRESHOLD_PX: 90,
  DISMISS_VELOCITY_THRESHOLD: 0.5,
  ANIMATION_DURATION_MS: 200,
  UNMOUNT_BUFFER_MS: 20,
  EASING_DISMISS: "cubic-bezier(0.32, 0.72, 0, 1)",
  EASING_RESET: "ease-out",
  SAFE_AREA_BOTTOM_OFFSET_PX: 14,
} as const;

const PopoverModeContext = React.createContext<boolean>(false)
const PopoverCloseContext = React.createContext<() => void>(() => {})
const PopoverOpenContext = React.createContext<boolean>(false)

type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root> & {
  forceFloating?: boolean
}

type PopoverTriggerProps = React.ComponentProps<typeof PopoverPrimitive.Trigger>

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  portal?: boolean
}

type PopoverAnchorProps = React.ComponentProps<typeof PopoverPrimitive.Anchor>

export function Popover({
  forceFloating = false,
  children,
  ...props
}: PopoverProps) {
  const { isMobile } = useResponsive()
  const useSheet = isMobile && !forceFloating

  if (useSheet) {
    const close = () => props.onOpenChange?.(false)

    return (
      <PopoverModeContext.Provider value={true}>
        <PopoverOpenContext.Provider value={props.open ?? false}>
          <PopoverCloseContext.Provider value={close}>
            <DialogPrimitive.Root {...props}>
              {children}
            </DialogPrimitive.Root>
          </PopoverCloseContext.Provider>
        </PopoverOpenContext.Provider>
      </PopoverModeContext.Provider>
    )
  }

  return (
    <PopoverModeContext.Provider value={false}>
      <PopoverPrimitive.Root data-slot="popover" {...props}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverModeContext.Provider>
  )
}

// Tags/condiciones que identifican un control de formulario nativo con
// comportamiento propio de foco/escritura (no debe ser "tragado" por el
// toggle automático del Trigger cuando está anidado dentro de él).
function isNestedFormControl(target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target === currentTarget) return false

  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function PopoverTrigger({
  className,
  onClick,
  ...props
}: PopoverTriggerProps) {
  const isSheet = React.useContext(PopoverModeContext)

  // BLOQUEO SENIOR (centralizado): Radix compone `onClick` (el que
  // pasemos) con su propio handler interno de toggle vía
  // composeEventHandlers, y solo ejecuta el suyo si el evento llega
  // sin `defaultPrevented`. Si el Trigger envuelve un control de
  // formulario nativo (input, textarea, select) y el click se originó
  // ahí y no en el propio elemento raíz del Trigger, prevenimos el
  // default: así ese control conserva su comportamiento normal (foco,
  // escritura, selección) y el popover/sheet NO hace toggle solo por
  // haber tocado un campo interno. El toggle sigue funcionando normal
  // para clicks en cualquier otra parte del Trigger (íconos, badges,
  // el propio botón, etc.).
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
      <DialogPrimitive.Trigger
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

function useSheetDragToDismiss(close: () => void, isOpen: boolean) {
  const [dragY, setDragY] = React.useState(0)
  const [dismissing, setDismissing] = React.useState(false)

  const draggingRef = React.useRef(false)
  const startYRef = React.useRef(0)
  const startTimeRef = React.useRef(0)
  const timeoutRef = React.useRef<number | null>(null)

  const clearPendingTimeout = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  function onPointerDown(event: React.PointerEvent) {
    draggingRef.current = true
    startYRef.current = event.clientY
    startTimeRef.current = performance.now()

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // noop
    }
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!draggingRef.current) return
    const delta = Math.max(0, event.clientY - startYRef.current)
    setDragY(delta)
  }

  function endDrag() {
    if (!draggingRef.current) return
    draggingRef.current = false

    const elapsed = Math.max(performance.now() - startTimeRef.current, 1)
    const velocity = dragY / elapsed

    const isThresholdPassed = dragY > SHEET_CONFIG.DISMISS_THRESHOLD_PX
    const isVelocityPassed = velocity > SHEET_CONFIG.DISMISS_VELOCITY_THRESHOLD

    if (isThresholdPassed || isVelocityPassed) {
      setDismissing(true)
      setDragY(window.innerHeight)

      clearPendingTimeout()
      const totalAnimationTime =
        SHEET_CONFIG.ANIMATION_DURATION_MS + SHEET_CONFIG.UNMOUNT_BUFFER_MS

      timeoutRef.current = window.setTimeout(close, totalAnimationTime)
      return
    }

    setDragY(0)
  }

  React.useEffect(() => {
    if (isOpen) {
      setDragY(0)
      setDismissing(false)
      clearPendingTimeout()
    }
    return clearPendingTimeout
  }, [isOpen, clearPendingTimeout])

  return {
    dragY,
    isDragging: draggingRef.current,
    dismissing,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}

export function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  avoidCollisions = true,
  collisionPadding = 12,
  portal = true,
  children,
  onPointerDownOutside,
  onInteractOutside,
  style,
  ...props
}: PopoverContentProps) {
  const isSheet = React.useContext(PopoverModeContext)
  const close = React.useContext(PopoverCloseContext)
  const isOpen = React.useContext(PopoverOpenContext)

  const { dragY, isDragging, dismissing, dragHandleProps } =
    useSheetDragToDismiss(close, isOpen)

  if (isSheet) {
    const transitionStyle = isDragging
      ? "none"
      : dismissing
        ? `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_DISMISS}`
        : `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`

    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          onPointerDown={(e) => {
            // Detiene la propagación para que el toque no active un botón de atrás,
            // pero permite que Radix procese el evento para CERRAR el Dialog.
            e.stopPropagation()
          }}
        />

        <DialogPrimitive.Content
          data-drag-scroll-ignore
          onOpenAutoFocus={(event) => {
            event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
          }}
          onPointerDownOutside={onPointerDownOutside}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col items-center",
            "rounded-t-3xl bg-popover shadow-2xl outline-none select-none",
            !dismissing && "data-[state=open]:animate-in data-[state=closed]:animate-out",
            !dismissing && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            !dismissing && "data-[state=closed]:duration-200 data-[state=open]:duration-300",
            className
          )}
          style={{
            ...style,
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: transitionStyle,
          }}
        >
          <VisuallyHidden asChild>
            <DialogPrimitive.Title>Opciones</DialogPrimitive.Title>
          </VisuallyHidden>

          <div
            {...dragHandleProps}
            className="flex w-full shrink-0 touch-none cursor-grab justify-center pb-1 pt-2.5 active:cursor-grabbing"
          >
            <div className="h-1.5 w-9 rounded-full bg-white/15" />
          </div>

          <div
            onWheel={(event) => {
              const element = event.currentTarget
              const isScrollable = element.scrollHeight > element.clientHeight
              if (isScrollable) {
                event.stopPropagation()
              }
            }}
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom) + ${SHEET_CONFIG.SAFE_AREA_BOTTOM_OFFSET_PX}px)`,
            }}
            className={cn(
              "flex w-full flex-col items-center gap-2.5 overflow-y-auto overscroll-contain",
              "px-2.5 pt-1 text-sm"
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
      data-drag-scroll-ignore
      align={align}
      side={side}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={(event) => {
        event.preventDefault()
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
      }}
      onPointerDownOutside={onPointerDownOutside}
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
        "z-40 pointer-events-auto flex flex-col gap-2.5 rounded-xl bg-popover p-2.5 text-sm shadow-xl outline-none",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </PopoverPrimitive.Content>
  )

  if (!portal) {
    return content
  }

  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
}

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

export { PopoverPrimitive }
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
  /**
   * Clases que aplican ÚNICAMENTE al popover flotante de desktop (ej.
   * un ancho fijo como "w-72" o "w-64" para que el popover no crezca
   * según su contenido).
   */
  floatingClassName?: string
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
  const hasCapturedRef = React.useRef(false)

  const clearPendingTimeout = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  function onPointerDown(event: React.PointerEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const scrollContainer = target.closest('.overflow-y-auto, [data-scrollable]');

    if (scrollContainer && scrollContainer.scrollTop > 0) {
      return;
    }

    draggingRef.current = true
    hasCapturedRef.current = false
    startYRef.current = event.clientY
    startTimeRef.current = performance.now()
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!draggingRef.current) return
    
    const delta = Math.max(0, event.clientY - startYRef.current)
    const DRAG_THRESHOLD = 3;

    if (delta > DRAG_THRESHOLD) {
      if (!hasCapturedRef.current) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
          hasCapturedRef.current = true
        } catch {
          // noop
        }
      }
      setDragY(delta)
    }
  }

  function endDrag(event: React.PointerEvent) {
    if (!draggingRef.current) return

    if (hasCapturedRef.current) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // noop
      }
    }

    draggingRef.current = false
    hasCapturedRef.current = false

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
        />

        <DialogPrimitive.Content
          data-drag-scroll-ignore
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            onOpenAutoFocus?.(event)
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            onCloseAutoFocus?.(event)
          }}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
          {...dragHandleProps}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col",
            "rounded-t-3xl bg-popover shadow-2xl outline-none select-none",
            !dismissing && "data-[state=open]:animate-in data-[state=closed]:animate-out",
            !dismissing && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            !dismissing && "data-[state=closed]:duration-200 data-[state=open]:duration-300"
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

          <div className="flex w-full shrink-0 touch-none justify-center pb-1 pt-2.5">
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
              "flex w-full flex-col gap-2.5 overflow-y-auto overscroll-contain",
              "px-4 pt-1 text-sm",
              className
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
        onOpenAutoFocus?.(event)
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
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
        "z-40 pointer-events-auto flex flex-col gap-2.5 rounded-xl bg-popover p-2.5 text-sm shadow-xl outline-none",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        floatingClassName,
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
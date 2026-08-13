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

  // Foco real del input de búsqueda — señal 100% confiable (evento
  // de JS normal, sin depender de visualViewport/window.innerHeight
  // ni de qué tan bien un navegador puntual respete el teclado).
  // Con foco: el sheet crece a la altura fija. Sin foco: se achica
  // al contenido (con un tope), como un sheet normal en reposo.
  const [isInputFocused, setIsInputFocused] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) setIsInputFocused(false)
  }, [isOpen])


  if (isSheet) {
    const transitionStyle: string = isDragging
      ? "none"
      : dismissing
        ? `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_DISMISS}, opacity ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ease-in`
        : `transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`

    /**
     * Altura dinámica según foco del buscador, no del teclado:
     * - Sin foco (reposo): auto, acotado a MAX_HEIGHT_RATIO — hug
     *   content, como cualquier sheet normal (4 opciones = sheet
     *   chico).
     * - Con foco: FIXED_HEIGHT_RATIO fijo — no se recalcula por
     *   cuánto encuentre la búsqueda (1 resultado no lo achica).
     * onFocusCapture/onBlurCapture detectan cualquier input/textarea
     * de adentro sin que cada caller tenga que avisar nada a mano.
     */
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 overscroll-contain bg-black/50 backdrop-blur-sm pointer-events-auto",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:duration-250 data-[state=open]:duration-200",
          )}
        />

        <DialogPrimitive.Content
          data-slot="popover-sheet"
          data-drag-scroll-ignore
          onFocusCapture={event => {
            const target = event.target
            if (
              target instanceof HTMLInputElement ||
              target instanceof HTMLTextAreaElement
            ) {
              setIsInputFocused(true)
            }
          }}
          onBlurCapture={event => {
            const target = event.target
            if (
              target instanceof HTMLInputElement ||
              target instanceof HTMLTextAreaElement
            ) {
              setIsInputFocused(false)
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
            // flex-col: handle (drag) | body scrolleable — drag SOLO en handle
            "fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden overscroll-contain",
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
            // height/maxHeight vía inline style, no clase Tailwind
            // dinámica (una clase armada con template string nunca
            // se genera en build — no es texto literal para el
            // scanner).
            //
            // CSS no anima una transición hacia/desde "auto" — por
            // eso en reposo usamos el alto MEDIDO en px (size.height,
            // de useSmoothResize) en vez de "auto": son dos valores
            // reales, así que la transición sí se ve. "auto" solo se
            // usa el primer instante, antes de que el ResizeObserver
            // mida algo (no hay nada de qué animar todavía ahí).
            height: isInputFocused
              ? `${SHEET_CONFIG.FIXED_HEIGHT_RATIO * 100}dvh`
              : size.height != null
                ? `${size.height + SHEET_CONFIG.CHROME_OVERHEAD_PX}px`
                : "auto",
            // maxHeight solo en reposo — si también estuviera puesto
            // con foco, CSS toma el menor entre height y maxHeight,
            // y la altura fija de arriba nunca se alcanzaría de verdad.
            maxHeight: isInputFocused
              ? undefined
              : `${SHEET_CONFIG.MAX_HEIGHT_RATIO * 100}dvh`,
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: isDragging
              ? "none"
              : dismissing
                ? transitionStyle
                : `height 200ms cubic-bezier(0.2,0,0,1), transform ${SHEET_CONFIG.ANIMATION_DURATION_MS}ms ${SHEET_CONFIG.EASING_RESET}`,
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

          {/* Viewport con scroll: acotado por lo que Content mida
              tener disponible en cada momento (fijo con foco, medido
              en reposo). */}
          <div
            onWheel={event => {
              const el = event.currentTarget
              if (el.scrollHeight > el.clientHeight) event.stopPropagation()
            }}
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${SHEET_CONFIG.SAFE_AREA_BOTTOM_OFFSET_PX}px)`,
            }}
            className={cn(
              // min-h-0 + flex-1: puede scrollear cuando el contenido
              // (measuredRef adentro) es más alto que el espacio real.
              // overscroll-contain: sin esto, arrastrar acá cuando NO
              // hay nada más para scrollear (lista corta, o ya se
              // llegó al límite) encadena el gesto al scroll de lo
              // que esté detrás en el DOM — se ve como que "se mueve
              // todo el layout" y aparece su scrollbar.
              "flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain",
              "px-4 pt-1 text-sm",
              className,
            )}
            {...props}
          >
            {/* measuredRef: SIN flex-1/min-h-0/overflow — crece a su
                tamaño natural sin importar cuánto espacio le den de
                verdad, así ResizeObserver mide "cuánto ocuparía si
                nadie lo recortara". Si midiera el propio viewport
                (que sí está acotado), su tamaño dependería de la
                altura que le pusimos a Content, que a su vez depende
                de esta medición — bucle. Separados, no hay bucle. */}
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
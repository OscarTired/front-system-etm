"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both"

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Orientación del scroll: vertical, horizontal o ambos ejes. Default: "vertical" */
  orientation?: ScrollAreaOrientation
  /** Muestra la barra de scroll nativa si es true. Default: false */
  showScrollbar?: boolean
  /** Habilita el arrastre por mouse (mouse drag-to-scroll). Default: false */
  dragToScroll?: boolean
  /** Si es true y orientation="horizontal", reconvierte el wheel vertical en scroll horizontal. Default: false */
  mapVerticalWheel?: boolean
  /** Distancia en píxeles antes de considerar un movimiento como arrastre en lugar de click. Default: 5 */
  dragThreshold?: number
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  isDragging: boolean
}

/**
 * Throttle de eventos guiado por requestAnimationFrame para 60-120fps sostenidos.
 */
function rafThrottle<T extends (...args: any[]) => void>(fn: T) {
  let rafId: number | null = null

  return function throttled(...args: Parameters<T>) {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      fn(...args)
      rafId = null
    })
  }
}

/**
 * ScrollArea - Componente de Scroll Nativo de Alto Rendimiento
 * Optimizado para Meta/Instagram-level Design Systems.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      orientation = "vertical",
      showScrollbar = false,
      dragToScroll = false,
      mapVerticalWheel = false,
      dragThreshold = 5,
      onPointerDown,
      onClickCapture,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = React.useRef<HTMLDivElement | null>(null)

    // Fusionador de refs seguro (Soporta Callback refs y RefObjects)
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [forwardedRef],
    )

    // Estado mutable desacoplado del ciclo de renderizado de React
    const dragState = React.useRef<DragState | null>(null)
    const wasJustDragging = React.useRef(false)

    // =========================================================================
    // 1. Manejo Nativo de Rueda (Wheel) con soporte de inercia
    // =========================================================================
    React.useEffect(() => {
      const el = internalRef.current
      if (!el || orientation !== "horizontal") return

      const handleWheel = (event: WheelEvent) => {
        // Evita interceptar si no hay overflow horizontal
        if (el.scrollWidth <= el.clientWidth + 1) return

        const absX = Math.abs(event.deltaX)
        const absY = Math.abs(event.deltaY)

        // Intención de scroll horizontal
        const isHorizontalIntent =
          absX > absY ||
          (event.shiftKey && absY > 0) ||
          (mapVerticalWheel && absY > 0)

        if (!isHorizontalIntent) return

        const delta = absX > absY ? event.deltaX : event.deltaY
        if (Math.abs(delta) < 0.1) return

        const maxScroll = el.scrollWidth - el.clientWidth
        const canScrollLeft = el.scrollLeft > 0 && delta < 0
        const canScrollRight = el.scrollLeft < maxScroll && delta > 0

        // Solo prevenir default si hay margen real para desplazar
        if (canScrollLeft || canScrollRight) {
          el.scrollBy({ left: delta, behavior: "auto" })
          event.preventDefault()
        }
      }

      // { passive: false } es crítico para poder invocar preventDefault
      el.addEventListener("wheel", handleWheel, { passive: false })
      return () => el.removeEventListener("wheel", handleWheel)
    }, [orientation, mapVerticalWheel])

    // =========================================================================
    // 2. Drag to Scroll (Mouse Pointers)
    // =========================================================================
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event)

      // Ignorar clicks secundarios o si está desactivado
      if (!dragToScroll || event.button !== 0) return

      // Filtro de elementos interactivos nativos
      const target = event.target as HTMLElement
      const isInteractive = target.closest(
        "button, a, input, textarea, select, option, [role='button'], [role='menuitem'], [role='tab'], [data-drag-ignore]",
      )
      if (isInteractive) return

      const el = internalRef.current
      if (!el) return

      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        isDragging: false,
      }

      wasJustDragging.current = false
    }

    // Actualización de scroll desacoplada vía rAF
    const updateScrollPosition = React.useMemo(
      () =>
        rafThrottle((clientX: number, clientY: number) => {
          const state = dragState.current
          const el = internalRef.current
          if (!state || !el) return

          const dx = clientX - state.startX
          const dy = clientY - state.startY

          if (orientation === "horizontal" || orientation === "both") {
            el.scrollLeft = state.scrollLeft - dx
          }
          if (orientation === "vertical" || orientation === "both") {
            el.scrollTop = state.scrollTop - dy
          }
        }),
      [orientation],
    )

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current
      if (!state || event.pointerId !== state.pointerId) return

      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY

      // Validar si superó el umbral de arrastre
      if (!state.isDragging) {
        if (Math.hypot(dx, dy) >= dragThreshold) {
          state.isDragging = true
          wasJustDragging.current = true

          // Bloquear eventos de puntero a sub-elementos durante el arrastre
          const el = internalRef.current
          if (el && !el.hasPointerCapture(event.pointerId)) {
            try {
              el.setPointerCapture(event.pointerId)
            } catch {
              /* Fallback en entornos sin pointer capture */
            }
          }
        } else {
          return
        }
      }

      updateScrollPosition(event.clientX, event.clientY)
    }

    const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current
      const el = internalRef.current

      if (!state || event.pointerId !== state.pointerId) return

      if (el && el.hasPointerCapture(event.pointerId)) {
        try {
          el.releasePointerCapture(event.pointerId)
        } catch {
          /* Fallback silencioso */
        }
      }

      dragState.current = null
    }

    // Prevención de disparo de clicks tras un arrastre (Drag)
    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
      if (wasJustDragging.current) {
        event.preventDefault()
        event.stopPropagation()
        wasJustDragging.current = false
      }
      onClickCapture?.(event)
    }

    // Limpieza de estado si el contenedor/pestaña pierde el foco
    React.useEffect(() => {
      const handleBlur = () => {
        dragState.current = null
        wasJustDragging.current = false
      }
      window.addEventListener("blur", handleBlur)
      return () => window.removeEventListener("blur", handleBlur)
    }, [])

    // =========================================================================
    // 3. Clases CSS y Rendimiento
    // =========================================================================
    return (
      <div
        ref={setRefs}
        data-slot="scroll-area"
        onPointerDown={handlePointerDown}
        onPointerMove={dragToScroll ? handlePointerMove : undefined}
        onPointerUp={dragToScroll ? stopDragging : undefined}
        onPointerCancel={dragToScroll ? stopDragging : undefined}
        onClickCapture={handleClickCapture}
        className={cn(
          // Layout Base & Hardware Acceleration
          "relative min-h-0 min-w-0 [transform:translateZ(0)]",

          // Touch Actions (Asegura scroll táctil nativo sin interferencia)
          orientation === "vertical" &&
            "overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y",
          orientation === "horizontal" &&
            "overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x",
          orientation === "both" &&
            "overflow-auto overscroll-contain touch-pan-x touch-pan-y",

          // Estilos de Cursor & Selección de texto
          dragToScroll && "cursor-grab active:cursor-grabbing select-none",

          // Visibilidad de Scrollbar
          showScrollbar
            ? "native-scrollbar"
            : "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

ScrollArea.displayName = "ScrollArea"
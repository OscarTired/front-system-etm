"use client"

import * as React from "react"

import { SHEET_CONFIG } from "./sheet-config"

export function useSheetDragToDismiss(close: () => void, isOpen: boolean) {
  const [dragY, setDragY] = React.useState(0)
  const [dismissing, setDismissing] = React.useState(false)

  const draggingRef = React.useRef(false)
  const hasCapturedRef = React.useRef(false)
  const startYRef = React.useRef(0)
  const startTimeRef = React.useRef(0)
  const timeoutRef = React.useRef<number | null>(null)

  const clearPendingTimeout = React.useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return

    // No arrancar el drag-to-dismiss si el toque empieza dentro de
    // un campo editable — si no, posicionar el cursor o seleccionar
    // texto en el buscador termina arrastrando el sheet entero (y
    // setPointerCapture le roba el puntero al input, cortando la
    // interacción de texto nativa a mitad de camino).
    const target = event.target as HTMLElement
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable
    ) {
      return
    }

    draggingRef.current = true
    hasCapturedRef.current = false
    startYRef.current = event.clientY
    startTimeRef.current = performance.now()
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!draggingRef.current) return

    const delta = Math.max(0, event.clientY - startYRef.current)
    if (delta > 3) {
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

    if (
      dragY > SHEET_CONFIG.DISMISS_THRESHOLD_PX ||
      velocity > SHEET_CONFIG.DISMISS_VELOCITY_THRESHOLD
    ) {
      setDismissing(true)
      setDragY(window.innerHeight)
      clearPendingTimeout()
      timeoutRef.current = window.setTimeout(
        close,
        SHEET_CONFIG.ANIMATION_DURATION_MS + SHEET_CONFIG.UNMOUNT_BUFFER_MS,
      )
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
"use client"

import * as React from "react"

import { SHEET_CONFIG } from "./sheet-config"

/**
 * Drag-to-dismiss solo desde el handle (no desde input/lista).
 */
export function useSheetDragToDismiss(close: () => void, isOpen: boolean) {
  const [dragY, setDragY] = React.useState(0)
  const [dismissing, setDismissing] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)

  const draggingRef = React.useRef(false)
  const hasCapturedRef = React.useRef(false)
  const startYRef = React.useRef(0)
  const startTimeRef = React.useRef(0)
  const dragYRef = React.useRef(0)
  const timeoutRef = React.useRef<number | null>(null)

  const clearPendingTimeout = React.useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return
    draggingRef.current = true
    hasCapturedRef.current = false
    startYRef.current = event.clientY
    startTimeRef.current = performance.now()
    dragYRef.current = 0
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
        setIsDragging(true)
        // Desenfocar buscador solo cuando el arrastre es real (desde handle)
        const active = document.activeElement
        if (active instanceof HTMLElement && active !== document.body) {
          active.blur()
        }
      }
      dragYRef.current = delta
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
    setIsDragging(false)

    const currentY = dragYRef.current
    const elapsed = Math.max(performance.now() - startTimeRef.current, 1)
    const velocity = currentY / elapsed

    if (
      currentY > SHEET_CONFIG.DISMISS_THRESHOLD_PX ||
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
    dragYRef.current = 0
  }

  React.useEffect(() => {
    if (isOpen) {
      setDragY(0)
      dragYRef.current = 0
      setDismissing(false)
      setIsDragging(false)
      clearPendingTimeout()
    }
    return clearPendingTimeout
  }, [isOpen, clearPendingTimeout])

  return {
    dragY,
    isDragging,
    dismissing,
    /** Solo para el handle bar — no en Content ni en el body. */
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
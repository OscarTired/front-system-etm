"use client"

import * as React from "react"

import { SHEET_CONFIG } from "./sheet-config"

/**
 * Drag-to-dismiss del bottom sheet.
 *
 * - Handle: siempre arrastrable.
 * - Contenido: solo si el scroll del body está en top (scrollTop <= 1)
 *   y el gesto es hacia abajo — no pelea con scroll interno.
 */
export function useSheetDragToDismiss(close: () => void, isOpen: boolean) {
  const [dragY, setDragY] = React.useState(0)
  const [dismissing, setDismissing] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)

  const draggingRef = React.useRef(false)
  const hasCapturedRef = React.useRef(false)
  const startYRef = React.useRef(0)
  const startXRef = React.useRef(0)
  const startTimeRef = React.useRef(0)
  const dragYRef = React.useRef(0)
  const timeoutRef = React.useRef<number | null>(null)
  const sourceRef = React.useRef<"handle" | "content">("handle")
  const scrollElRef = React.useRef<HTMLElement | null>(null)
  const lockedScrollRef = React.useRef(false)

  const clearPendingTimeout = React.useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resetGesture = React.useCallback(() => {
    draggingRef.current = false
    hasCapturedRef.current = false
    lockedScrollRef.current = false
    scrollElRef.current = null
    setIsDragging(false)
    setDragY(0)
    dragYRef.current = 0
  }, [])

  function beginDrag(
    event: React.PointerEvent,
    source: "handle" | "content",
  ) {
    if (event.button !== 0) return

    if (source === "content") {
      const target = event.target
      if (!(target instanceof Element)) return
      if (
        target.closest(
          "input, textarea, select, button, a, [role='button'], [data-no-sheet-drag]",
        )
      ) {
        return
      }
      const scrollEl =
        (target.closest("[data-sheet-scroll]") as HTMLElement | null) ??
        (event.currentTarget as HTMLElement)
      if (scrollEl.scrollTop > 1) return
      scrollElRef.current = scrollEl
    } else {
      scrollElRef.current = null
    }

    sourceRef.current = source
    draggingRef.current = true
    hasCapturedRef.current = false
    lockedScrollRef.current = false
    startYRef.current = event.clientY
    startXRef.current = event.clientX
    startTimeRef.current = performance.now()
    dragYRef.current = 0
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!draggingRef.current) return

    const dy = event.clientY - startYRef.current
    const dx = event.clientX - startXRef.current

    if (sourceRef.current === "content" && !hasCapturedRef.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        draggingRef.current = false
        return
      }
      if (dy < -4) {
        draggingRef.current = false
        return
      }
      const el = scrollElRef.current
      if (el && el.scrollTop > 1) {
        draggingRef.current = false
        return
      }
    }

    const delta = Math.max(0, dy)
    if (delta <= 3) return

    if (!hasCapturedRef.current) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
        hasCapturedRef.current = true
      } catch {
        // noop
      }
      lockedScrollRef.current = true
      setIsDragging(true)
      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body) {
        active.blur()
      }
    }

    if (lockedScrollRef.current && scrollElRef.current) {
      scrollElRef.current.scrollTop = 0
    }

    dragYRef.current = delta
    setDragY(delta)
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
    lockedScrollRef.current = false
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
    if (!isOpen) return
    setDismissing(false)
    resetGesture()
    clearPendingTimeout()
    return clearPendingTimeout
  }, [isOpen, clearPendingTimeout, resetGesture])

  const handleHandlers = {
    onPointerDown: (e: React.PointerEvent) => beginDrag(e, "handle"),
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }

  const contentHandlers = {
    onPointerDown: (e: React.PointerEvent) => beginDrag(e, "content"),
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }

  return {
    dragY,
    isDragging,
    dismissing,
    dragHandleProps: handleHandlers,
    contentDragProps: contentHandlers,
  }
}

"use client"

import { useCallback, useRef } from "react"

/**
 * Swipe horizontal sobre un segmented control (móvil).
 * - swipe izquierda → siguiente opción
 * - swipe derecha → opción anterior
 * Umbral ~40px para no pelear con taps.
 */
export function useSwipeSegment<T extends string>(
  keys: readonly T[],
  value: T,
  onChange: (next: T) => void,
) {
  const startX = useRef<number | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Solo touch / pen; mouse sigue con click en cada botón
    if (e.pointerType === "mouse") return
    startX.current = e.clientX
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") return
      if (startX.current == null) return
      const dx = e.clientX - startX.current
      startX.current = null
      if (Math.abs(dx) < 40) return

      const i = keys.indexOf(value)
      if (i < 0) return
      if (dx < 0 && i < keys.length - 1) onChange(keys[i + 1]!)
      if (dx > 0 && i > 0) onChange(keys[i - 1]!)
    },
    [keys, value, onChange],
  )

  const onPointerCancel = useCallback(() => {
    startX.current = null
  }, [])

  return { onPointerDown, onPointerUp, onPointerCancel }
}

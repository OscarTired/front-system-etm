"use client"

import { useCallback, useMemo, useRef, useState } from "react"

type UseLongPressOptions = {
  onLongPress: () => void
  onPressStart?: () => void
  onCancel?: () => void
  threshold?: number
  pressedThreshold?: number
  moveTolerance?: number
}

type LongPressBind = {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onClickCapture: (e: React.MouseEvent) => void
}

/**
 * Long-press con bloqueo del click/tap que sigue al soltar el dedo
 * (si no, el pointerup cae sobre el botón del overlay recién abierto).
 */
export function useLongPress({
  onLongPress,
  onPressStart,
  onCancel,
  threshold = 320,
  pressedThreshold = 150,
  moveTolerance = 10,
}: UseLongPressOptions): {
  bind: LongPressBind
  pressed: boolean
  triggered: boolean
} {
  const [pressed, setPressed] = useState(false)
  const [triggered, setTriggered] = useState(false)

  const pressedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  /** Bloquea el click sintético posterior al long-press. */
  const suppressClickRef = useRef(false)
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimers() {
    if (pressedTimer.current) {
      clearTimeout(pressedTimer.current)
      pressedTimer.current = null
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const armClickSuppress = useCallback(() => {
    suppressClickRef.current = true
    if (suppressTimer.current) clearTimeout(suppressTimer.current)
    // Ventana generosa: Android a veces emite click tardío.
    suppressTimer.current = setTimeout(() => {
      suppressClickRef.current = false
      suppressTimer.current = null
    }, 450)
  }, [])

  const reset = useCallback(
    (didCancel: boolean) => {
      clearTimers()
      startPos.current = null
      setPressed(false)
      if (didCancel && triggered) {
        onCancel?.()
      }
      setTriggered(false)
    },
    [onCancel, triggered],
  )

  const start = useCallback(
    (x: number, y: number) => {
      startPos.current = { x, y }

      pressedTimer.current = setTimeout(() => {
        setPressed(true)
        onPressStart?.()
      }, pressedThreshold)

      longPressTimer.current = setTimeout(() => {
        setTriggered(true)
        armClickSuppress()
        onLongPress()
      }, threshold)
    },
    [armClickSuppress, onLongPress, onPressStart, pressedThreshold, threshold],
  )

  const move = useCallback(
    (x: number, y: number) => {
      if (!startPos.current) return
      const dx = Math.abs(x - startPos.current.x)
      const dy = Math.abs(y - startPos.current.y)
      if (dx > moveTolerance || dy > moveTolerance) {
        reset(true)
      }
    },
    [moveTolerance, reset],
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => start(e.clientX, e.clientY),
    [start],
  )
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => move(e.clientX, e.clientY),
    [move],
  )
  const onMouseUp = useCallback(() => reset(false), [reset])
  const onMouseLeave = useCallback(() => reset(true), [reset])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      start(touch.clientX, touch.clientY)
    },
    [start],
  )
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      move(touch.clientX, touch.clientY)
    },
    [move],
  )
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (suppressClickRef.current) {
        e.preventDefault()
      }
      reset(false)
    },
    [reset],
  )

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (!suppressClickRef.current) return
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const bind: LongPressBind = useMemo(
    () => ({
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onClickCapture,
    }),
    [
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onClickCapture,
    ],
  )

  return { bind, pressed, triggered }
}

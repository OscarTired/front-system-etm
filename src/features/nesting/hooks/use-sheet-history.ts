"use client"

import { useCallback, useRef, useState } from "react"

export type SheetEditState = {
  positionOverrides: Record<number, { dx: number; dy: number }>
  angleOverrides: Record<number, number>
}

type HistoryEntry = {
  label: string
  state: SheetEditState
}

type Stack = {
  past: HistoryEntry[]
  future: HistoryEntry[]
  current: SheetEditState
}

const MAX_STACK = 80

function emptyState(): SheetEditState {
  return { positionOverrides: {}, angleOverrides: {} }
}

function emptyStack(): Stack {
  return { past: [], future: [], current: emptyState() }
}

function cloneState(s: SheetEditState): SheetEditState {
  return {
    positionOverrides: { ...s.positionOverrides },
    angleOverrides: { ...s.angleOverrides },
  }
}

function statesEqual(a: SheetEditState, b: SheetEditState): boolean {
  const pkA = Object.keys(a.positionOverrides)
  const pkB = Object.keys(b.positionOverrides)
  const akA = Object.keys(a.angleOverrides)
  const akB = Object.keys(b.angleOverrides)
  if (pkA.length !== pkB.length || akA.length !== akB.length) return false
  for (const k of pkA) {
    const pa = a.positionOverrides[Number(k)]
    const pb = b.positionOverrides[Number(k)]
    if (!pb || Math.abs(pa.dx - pb.dx) > 1e-9 || Math.abs(pa.dy - pb.dy) > 1e-9) return false
  }
  for (const k of akA) {
    if (Math.abs((a.angleOverrides[Number(k)] ?? 0) - (b.angleOverrides[Number(k)] ?? 0)) > 1e-9) {
      return false
    }
  }
  return true
}

/**
 * Historial **por plancha** (clave = índice de tab / grupo).
 * Ctrl+Z en plancha 2 no afecta plancha 1.
 */
export function useSheetHistory() {
  const stacksRef = useRef<Record<string, Stack>>({})
  const keyRef = useRef("0")
  const [, bump] = useState(0)
  const rerender = useCallback(() => bump((n) => n + 1), [])

  const ensure = useCallback((key: string): Stack => {
    if (!stacksRef.current[key]) stacksRef.current[key] = emptyStack()
    return stacksRef.current[key]
  }, [])

  const getStack = useCallback(() => ensure(keyRef.current), [ensure])

  const setActiveKey = useCallback(
    (key: string | number) => {
      keyRef.current = String(key)
      ensure(keyRef.current)
      rerender()
    },
    [ensure, rerender]
  )

  const commit = useCallback(
    (label: string, next: SheetEditState) => {
      const stack = getStack()
      if (statesEqual(stack.current, next)) return
      stack.past = [...stack.past, { label, state: cloneState(stack.current) }].slice(-MAX_STACK)
      stack.future = []
      stack.current = cloneState(next)
      rerender()
    },
    [getStack, rerender]
  )

  const replace = useCallback(
    (next: SheetEditState) => {
      const stack = getStack()
      stack.past = []
      stack.future = []
      stack.current = cloneState(next)
      rerender()
    },
    [getStack, rerender]
  )

  const undo = useCallback(() => {
    const stack = getStack()
    if (stack.past.length === 0) return
    const entry = stack.past[stack.past.length - 1]
    stack.past = stack.past.slice(0, -1)
    stack.future = [...stack.future, { label: entry.label, state: cloneState(stack.current) }]
    stack.current = cloneState(entry.state)
    rerender()
  }, [getStack, rerender])

  const redo = useCallback(() => {
    const stack = getStack()
    if (stack.future.length === 0) return
    const entry = stack.future[stack.future.length - 1]
    stack.future = stack.future.slice(0, -1)
    stack.past = [...stack.past, { label: entry.label, state: cloneState(stack.current) }]
    stack.current = cloneState(entry.state)
    rerender()
  }, [getStack, rerender])

  const reset = useCallback(() => {
    replace(emptyState())
  }, [replace])

  /** Borra todos los stacks (Nestear / descartar sesión). */
  const resetAll = useCallback(() => {
    stacksRef.current = {}
    keyRef.current = "0"
    ensure("0")
    rerender()
  }, [ensure, rerender])

  const stack = ensure(keyRef.current)

  return {
    activeKey: keyRef.current,
    setActiveKey,
    state: stack.current,
    positionOverrides: stack.current.positionOverrides,
    angleOverrides: stack.current.angleOverrides,
    commit,
    replace,
    undo,
    redo,
    reset,
    resetAll,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
  }
}

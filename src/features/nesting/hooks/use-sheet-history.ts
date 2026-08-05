"use client"

import { useCallback, useMemo, useRef, useState } from "react"

export type SheetEditState = {
  positionOverrides: Record<number, { dx: number; dy: number }>
  angleOverrides: Record<number, number>
}

export type HistoryEntry = {
  label: string
  state: SheetEditState
}

const MAX_STACK = 80

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
 * Historial snapshot de edición de plancha (overrides pos/ángulo).
 * - commit(label, next): apila estado anterior y aplica next
 * - undo / redo
 * - reset: limpia al cambiar plancha / Nestear / restaurar sesión
 *
 * IMPORTANTE: el objeto retornado está memoizado con useMemo. Sin esto,
 * cada render devuelve un objeto con identidad nueva, lo que rompe cualquier
 * useEffect en un consumidor que lo incluya en su array de dependencias
 * (puede producir bucles infinitos si ese efecto a su vez llama a alguna
 * función que actualice estado, como `replace`).
 */
export function useSheetHistory(initial?: SheetEditState) {
  const empty: SheetEditState = initial ?? { positionOverrides: {}, angleOverrides: {} }
  const [state, setState] = useState<SheetEditState>(empty)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [lastLabel, setLastLabel] = useState<string | null>(null)

  const pastRef = useRef<HistoryEntry[]>([])
  const futureRef = useRef<HistoryEntry[]>([])
  const stateRef = useRef(state)
  stateRef.current = state

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  const commit = useCallback(
    (label: string, next: SheetEditState) => {
      const prev = stateRef.current
      if (statesEqual(prev, next)) return
      pastRef.current = [...pastRef.current, { label, state: cloneState(prev) }].slice(-MAX_STACK)
      futureRef.current = []
      const cloned = cloneState(next)
      stateRef.current = cloned
      setState(cloned)
      setLastLabel(label)
      syncFlags()
    },
    [syncFlags]
  )

  /** Aplica next sin historiar (hidratación, cambio de tab, nest). */
  const replace = useCallback(
    (next: SheetEditState) => {
      pastRef.current = []
      futureRef.current = []
      const cloned = cloneState(next)
      stateRef.current = cloned
      setState(cloned)
      setLastLabel(null)
      syncFlags()
    },
    [syncFlags]
  )

  const undo = useCallback(() => {
    const past = pastRef.current
    if (past.length === 0) return
    const entry = past[past.length - 1]
    pastRef.current = past.slice(0, -1)
    futureRef.current = [
      ...futureRef.current,
      { label: entry.label, state: cloneState(stateRef.current) },
    ]
    const restored = cloneState(entry.state)
    stateRef.current = restored
    setState(restored)
    setLastLabel(`Deshacer: ${entry.label}`)
    syncFlags()
  }, [syncFlags])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (future.length === 0) return
    const entry = future[future.length - 1]
    futureRef.current = future.slice(0, -1)
    pastRef.current = [
      ...pastRef.current,
      { label: entry.label, state: cloneState(stateRef.current) },
    ]
    const restored = cloneState(entry.state)
    stateRef.current = restored
    setState(restored)
    setLastLabel(`Rehacer: ${entry.label}`)
    syncFlags()
  }, [syncFlags])

  const reset = useCallback(() => {
    replace({ positionOverrides: {}, angleOverrides: {} })
  }, [replace])

  return useMemo(
    () => ({
      state,
      positionOverrides: state.positionOverrides,
      angleOverrides: state.angleOverrides,
      commit,
      replace,
      undo,
      redo,
      reset,
      canUndo,
      canRedo,
      lastLabel,
    }),
    [state, commit, replace, undo, redo, reset, canUndo, canRedo, lastLabel]
  )
}
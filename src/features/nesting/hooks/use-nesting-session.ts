"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

type HistoryApi = {
  positionOverrides: Record<number, { dx: number; dy: number }>
  angleOverrides: Record<number, number>
  replace: (s: {
    positionOverrides: Record<number, { dx: number; dy: number }>
    angleOverrides: Record<number, number>
  }) => void
  reset: () => void
  resetAll?: () => void
  undo: () => void
  redo: () => void
  setActiveKey: (key: number | string) => void
}

type ProjectSessionApi = {
  sessionReady: boolean
  sessionRestored: boolean
  sessionSavedAt?: string | number | null
  onDiscardSession: () => void
  getActiveGroupIndexForSession: () => number
  getSheetEdits: () => Record<
    string,
    {
      positionOverrides?: Record<number, { dx: number; dy: number }>
      angleOverrides?: Record<number, number>
      lockedIndices?: number[]
    }
  >
  setSheetEdits: (edits: Record<string, unknown>) => void
  setActiveGroupIndexForSession: (idx: number) => void
  requestSessionSave: () => void
}

/**
 * Toast de restauración, atajos undo/redo/delete, hidratar y persistir
 * edits por plancha.
 */
export function useNestingSession(opts: {
  project: ProjectSessionApi
  history: HistoryApi
  activeGroupIndex: number
  lockedPieceIndices: number[]
  setActiveGroupIndex: (n: number) => void
  setSelectedPieceIndices: (n: number[]) => void
  setLockedPieceIndices: (n: number[] | ((p: number[]) => number[])) => void
  onDeleteSelected: () => void
}) {
  const {
    project,
    history,
    activeGroupIndex,
    lockedPieceIndices,
    setActiveGroupIndex,
    setSelectedPieceIndices,
    setLockedPieceIndices,
    onDeleteSelected,
  } = opts

  const projectRef = useRef(project)
  const historyRef = useRef(history)
  const deleteRef = useRef(onDeleteSelected)
  useEffect(() => {
    projectRef.current = project
  })
  useEffect(() => {
    historyRef.current = history
  })
  useEffect(() => {
    deleteRef.current = onDeleteSelected
  })

  const positionOverrides = history.positionOverrides
  const angleOverrides = history.angleOverrides

  const sessionToastShownRef = useRef(false)
  useEffect(() => {
    if (project.sessionRestored && !sessionToastShownRef.current) {
      sessionToastShownRef.current = true
      toast("Trabajo restaurado", {
        description: `Recuperado del navegador${
          project.sessionSavedAt
            ? ` · ${new Date(project.sessionSavedAt).toLocaleString()}`
            : ""
        }`,
        duration: Infinity,
        action: {
          label: "Descartar",
          onClick: () => {
            project.onDiscardSession()
            history.resetAll?.() ?? history.reset()
            setSelectedPieceIndices([])
            setActiveGroupIndex(0)
          },
        },
      })
    }
  }, [project, history, setSelectedPieceIndices, setActiveGroupIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault()
          history.undo()
        } else if ((key === "z" && e.shiftKey) || key === "y") {
          e.preventDefault()
          history.redo()
        }
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        deleteRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [history])

  const editsHydratedRef = useRef(false)
  useEffect(() => {
    if (!project.sessionReady || editsHydratedRef.current) return
    editsHydratedRef.current = true
    if (!project.sessionRestored) return
    const idx = project.getActiveGroupIndexForSession()
    if (typeof idx === "number" && idx >= 0) setActiveGroupIndex(idx)
    const snap = project.getSheetEdits()[String(idx ?? 0)]
    if (snap) {
      history.replace({
        positionOverrides: snap.positionOverrides ?? {},
        angleOverrides: snap.angleOverrides ?? {},
      })
      setLockedPieceIndices(snap.lockedIndices ?? [])
    } else {
      history.resetAll?.() ?? history.reset()
      setLockedPieceIndices([])
    }
  }, [project.sessionReady, project.sessionRestored, history, project, setActiveGroupIndex, setLockedPieceIndices])

  useEffect(() => {
    const p = projectRef.current
    if (!p.sessionReady || !editsHydratedRef.current) return
    const key = String(activeGroupIndex)
    const prev = p.getSheetEdits()
    p.setSheetEdits({
      ...prev,
      [key]: { positionOverrides, angleOverrides, lockedIndices: lockedPieceIndices },
    })
    p.setActiveGroupIndexForSession(activeGroupIndex)
    p.requestSessionSave()
  }, [positionOverrides, angleOverrides, lockedPieceIndices, activeGroupIndex])

  return { projectRef, historyRef, editsHydratedRef }
}

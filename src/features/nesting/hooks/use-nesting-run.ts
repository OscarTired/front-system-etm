"use client"

import { useCallback, useState } from "react"
import type { HistoryLike } from "./use-nesting-transforms"
import { NestingToast } from "./nesting-feedback"

export function useNestingRun(opts: {
  history: HistoryLike
  isRunning: boolean
  rowsCount: number
  sheetGroupsCount: number
  onRun: () => void
  setLockedPieceIndices: (v: number[] | ((p: number[]) => number[])) => void
  setActiveGroupIndex: (v: number) => void
  setSelectedPieceIndices: (v: number[]) => void
}) {
  const {
    history,
    isRunning,
    rowsCount,
    sheetGroupsCount,
    onRun,
    setLockedPieceIndices,
    setActiveGroupIndex,
    setSelectedPieceIndices,
  } = opts

  const [pendingRenest, setPendingRenest] = useState(false)

  const doRunNesting = useCallback(() => {
    history.replace({ positionOverrides: {}, angleOverrides: {} })
    setLockedPieceIndices([])
    setActiveGroupIndex(0)
    setSelectedPieceIndices([])
    onRun()
  }, [history, onRun, setLockedPieceIndices, setActiveGroupIndex, setSelectedPieceIndices])

  const handleRun = useCallback(() => {
    if (isRunning) {
      NestingToast.nestRunning()
      return
    }
    if (rowsCount === 0) {
      NestingToast.nestEmpty()
      return
    }
    const hasNest = sheetGroupsCount > 0
    const hasEdits =
      Object.keys(history.positionOverrides).length > 0 ||
      Object.keys(history.angleOverrides).length > 0
    if (hasNest || hasEdits) {
      setPendingRenest(true)
      return
    }
    doRunNesting()
  }, [isRunning, rowsCount, sheetGroupsCount, history, doRunNesting])

  return {
    pendingRenest,
    setPendingRenest,
    handleRun,
    doRunNesting,
  }
}

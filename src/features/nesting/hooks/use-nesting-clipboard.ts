"use client"

import { useCallback, useRef, useState } from "react"
import type { HistoryLike } from "./use-nesting-transforms"
import { NestingToast } from "./nesting-feedback"

type OffsetClipItem = { dx: number; dy: number; angle: number }
type OffsetsClipboard = {
  items: OffsetClipItem[]
  sourceGroupIndex: number
}

export function useNestingClipboard(opts: {
  history: HistoryLike
  lockedPieceIndices: number[]
  activeGroupIndex: number
}) {
  const { history, lockedPieceIndices, activeGroupIndex } = opts
  const clipboardRef = useRef<OffsetsClipboard | null>(null)
  const [version, setVersion] = useState(0)

  const copy = useCallback(
    (
      selectedPieceIndices: number[],
      positionOverrides: Record<number, { dx: number; dy: number }>,
      angleOverrides: Record<number, number>,
    ) => {
      if (selectedPieceIndices.length === 0) {
        NestingToast.needSelection()
        return
      }
      const items = selectedPieceIndices.map((idx) => ({
        dx: positionOverrides[idx]?.dx ?? 0,
        dy: positionOverrides[idx]?.dy ?? 0,
        angle: angleOverrides[idx] ?? 0,
      }))
      clipboardRef.current = { items, sourceGroupIndex: activeGroupIndex }
      setVersion((v) => v + 1)
      NestingToast.copyOk(items.length)
    },
    [activeGroupIndex],
  )

  const paste = useCallback(
    (selectedPieceIndices: number[]) => {
      const clip = clipboardRef.current
      if (!clip || clip.items.length === 0) {
        NestingToast.pasteEmpty()
        return
      }
      if (selectedPieceIndices.length === 0) {
        NestingToast.needSelection()
        return
      }
      const nextPos = { ...history.positionOverrides }
      const nextAng = { ...history.angleOverrides }
      selectedPieceIndices.forEach((idx, i) => {
        if (lockedPieceIndices.includes(idx)) return
        const item = clip.items[i] ?? clip.items[0]
        nextPos[idx] = { dx: item.dx, dy: item.dy }
        nextAng[idx] = item.angle
      })
      history.commit("Pegar offsets", {
        positionOverrides: nextPos,
        angleOverrides: nextAng,
      })
    },
    [history, lockedPieceIndices],
  )

  return {
    copy,
    paste,
    canPaste: version > 0,
    version,
  }
}

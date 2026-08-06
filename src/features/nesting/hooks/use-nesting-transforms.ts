"use client"

import { useCallback } from "react"
import { boundingRect, rotateOutlineAroundPoint } from "../engine/geometry"
import { piecesCollide } from "../engine/polygon-collision"
import type { PlacedPiece } from "../engine/types"
import { constrainToMode } from "../utils/transform-mode"
import { NestingToast } from "./nesting-feedback"

export type SheetConfigLike = {
  width: number
  height: number
  margin?: number
}

export type HistoryLike = {
  positionOverrides: Record<number, { dx: number; dy: number }>
  angleOverrides: Record<number, number>
  commit: (
    label: string,
    snap: {
      positionOverrides: Record<number, { dx: number; dy: number }>
      angleOverrides: Record<number, number>
    },
  ) => void
  replace: (snap: {
    positionOverrides: Record<number, { dx: number; dy: number }>
    angleOverrides: Record<number, number>
  }) => void
}

function outlineInsideSheet(
  outline: { points: { x: number; y: number }[] },
  sheet: SheetConfigLike,
): boolean {
  const b = boundingRect(outline)
  const m = sheet.margin ?? 0
  return (
    b.x >= m - 0.05 &&
    b.y >= m - 0.05 &&
    b.x + b.width <= sheet.width - m + 0.05 &&
    b.y + b.height <= sheet.height - m + 0.05
  )
}

export function useNestingTransforms(opts: {
  history: HistoryLike
  canvasPieces: PlacedPiece[]
  rawPieces: PlacedPiece[]
  lockedPieceIndices: number[]
  sheetConfig: SheetConfigLike
  transformMode: "free" | "geometric"
}) {
  const {
    history,
    canvasPieces,
    rawPieces,
    lockedPieceIndices,
    sheetConfig,
    transformMode,
  } = opts

  const handleMovePieces = useCallback(
    (pieceIndices: number[], dx: number, dy: number) => {
      if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return
      let moveDx = dx
      let moveDy = dy
      if (transformMode === "geometric") {
        const c = constrainToMode(dx, dy, "geometric")
        moveDx = c.dx
        moveDy = c.dy
      }
      const prev = history.positionOverrides
      const nextPos = { ...prev }
      for (const idx of pieceIndices) {
        if (lockedPieceIndices.includes(idx)) continue
        const cur = prev[idx] ?? { dx: 0, dy: 0 }
        nextPos[idx] = { dx: cur.dx + moveDx, dy: cur.dy + moveDy }
      }
      const n = pieceIndices.length
      history.commit(n === 1 ? "Mover pieza" : `Mover ${n} piezas`, {
        positionOverrides: nextPos,
        angleOverrides: history.angleOverrides,
      })
    },
    [history, lockedPieceIndices, transformMode],
  )

  const handleRotateSelected = useCallback(
    (pieceIndices: number[], degrees: number) => {
      if (pieceIndices.length === 0 || Math.abs(degrees) < 1e-9) return
      const nextAng = { ...history.angleOverrides }
      const rotating = new Set(pieceIndices)
      const simulated: { idx: number; piece: PlacedPiece }[] = []

      for (const idx of pieceIndices) {
        if (lockedPieceIndices.includes(idx)) {
          NestingToast.locked()
          return
        }
        const p = rawPieces[idx]
        if (!p) continue
        const cur = nextAng[idx] ?? 0
        const newAng = ((cur + degrees) % 360 + 360) % 360
        nextAng[idx] = newAng
        let piece: PlacedPiece = p
        if (newAng) {
          const b = boundingRect(p.outline)
          const pivot = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
          piece = {
            ...p,
            angle: ((p.angle + newAng) % 360 + 360) % 360,
            outline: rotateOutlineAroundPoint(p.outline, newAng, pivot),
            subEntities: p.subEntities?.map((s) => ({
              ...s,
              outline: rotateOutlineAroundPoint(s.outline, newAng, pivot),
            })),
          }
        }
        const override = history.positionOverrides[idx]
        if (override) {
          const { dx, dy } = override
          piece = {
            ...piece,
            x: piece.x + dx,
            y: piece.y + dy,
            outline: {
              points: piece.outline.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
            },
            subEntities: piece.subEntities?.map((s) => ({
              ...s,
              outline: {
                points: s.outline.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
              },
            })),
          }
        }
        if (!outlineInsideSheet(piece.outline, sheetConfig)) {
          NestingToast.rotateOutOfSheet()
          return
        }
        simulated.push({ idx, piece })
      }
      if (simulated.length === 0) return

      for (const { idx, piece } of simulated) {
        for (let o = 0; o < canvasPieces.length; o++) {
          if (o === idx) continue
          if (rotating.has(o)) {
            const otherSim = simulated.find((s) => s.idx === o)
            if (otherSim && piecesCollide(piece, otherSim.piece)) {
              NestingToast.rotateCollision()
              return
            }
            continue
          }
          if (piecesCollide(piece, canvasPieces[o])) {
            NestingToast.rotateCollision()
            return
          }
        }
      }

      const sign = degrees >= 0 ? "+" : ""
      history.commit(`Rotar ${sign}${degrees}°`, {
        positionOverrides: history.positionOverrides,
        angleOverrides: nextAng,
      })
    },
    [history, rawPieces, lockedPieceIndices, canvasPieces, sheetConfig],
  )

  const handleRotateAroundPivot = useCallback(
    (pieceIndices: number[], pivot: { x: number; y: number }, degrees: number) => {
      if (pieceIndices.length === 0 || Math.abs(degrees) < 1e-6) return
      const rad = (degrees * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const nextPos = { ...history.positionOverrides }
      const nextAng = { ...history.angleOverrides }
      for (const idx of pieceIndices) {
        if (lockedPieceIndices.includes(idx)) continue
        const piece = canvasPieces[idx]
        if (!piece) continue
        const b = boundingRect(piece.outline)
        const cx = b.x + b.width / 2
        const cy = b.y + b.height / 2
        const dx0 = cx - pivot.x
        const dy0 = cy - pivot.y
        const nx = pivot.x + dx0 * cos - dy0 * sin
        const ny = pivot.y + dx0 * sin + dy0 * cos
        const prev = nextPos[idx] ?? { dx: 0, dy: 0 }
        nextPos[idx] = {
          dx: prev.dx + (nx - cx),
          dy: prev.dy + (ny - cy),
        }
        nextAng[idx] = (((nextAng[idx] ?? 0) + degrees) % 360 + 360) % 360
      }
      history.commit("Rotar pivot", {
        positionOverrides: nextPos,
        angleOverrides: nextAng,
      })
    },
    [history, canvasPieces, lockedPieceIndices],
  )

  const handleAlign = useCallback(
    (
      mode: "left" | "right" | "top" | "bottom" | "center-h" | "center-v",
      selectedPieceIndices: number[],
    ) => {
      if (selectedPieceIndices.length < 2) {
        NestingToast.needSelection()
        return
      }
      const refIndex = selectedPieceIndices[selectedPieceIndices.length - 1]
      const refPiece = canvasPieces[refIndex]
      if (!refPiece) return
      const refBounds = boundingRect(refPiece.outline)
      const prev = history.positionOverrides
      const next = { ...prev }
      const locked = new Set(lockedPieceIndices)
      let moved = 0

      const sortedIndices = [...selectedPieceIndices]
        .filter((idx) => idx !== refIndex && !locked.has(idx))
        .sort((iA, iB) => {
          const pieceA = canvasPieces[iA]
          const pieceB = canvasPieces[iB]
          if (!pieceA || !pieceB) return 0
          const bA = boundingRect(pieceA.outline)
          const bB = boundingRect(pieceB.outline)
          if (mode === "left" || mode === "right" || mode === "center-h") {
            return Math.abs(bA.x - refBounds.x) - Math.abs(bB.x - refBounds.x)
          }
          return Math.abs(bA.y - refBounds.y) - Math.abs(bB.y - refBounds.y)
        })

      for (const idx of sortedIndices) {
        const piece = canvasPieces[idx]
        if (!piece) continue
        const b = boundingRect(piece.outline)
        const current = prev[idx] ?? { dx: 0, dy: 0 }
        let targetDx = current.dx
        let targetDy = current.dy
        if (mode === "left") targetDx = current.dx + (refBounds.x - b.x)
        else if (mode === "right")
          targetDx = current.dx + (refBounds.x + refBounds.width - (b.x + b.width))
        else if (mode === "center-h")
          targetDx =
            current.dx + (refBounds.x + refBounds.width / 2 - (b.x + b.width / 2))
        else if (mode === "top") targetDy = current.dy + (refBounds.y - b.y)
        else if (mode === "bottom")
          targetDy = current.dy + (refBounds.y + refBounds.height - (b.y + b.height))
        else if (mode === "center-v")
          targetDy =
            current.dy + (refBounds.y + refBounds.height / 2 - (b.y + b.height / 2))

        const ddx = targetDx - current.dx
        const ddy = targetDy - current.dy

        const collidesAt = (fx: number, fy: number) => {
          const testPiece: PlacedPiece = {
            ...piece,
            x: piece.x + (fx - current.dx),
            y: piece.y + (fy - current.dy),
            outline: {
              points: piece.outline.points.map((pt) => ({
                x: pt.x + (fx - current.dx),
                y: pt.y + (fy - current.dy),
              })),
            },
          }
          for (let o = 0; o < canvasPieces.length; o++) {
            if (o === idx) continue
            let other = canvasPieces[o]
            const otherOverride = next[o]
            if (otherOverride) {
              const base = prev[o] ?? { dx: 0, dy: 0 }
              const odx = otherOverride.dx - base.dx
              const ody = otherOverride.dy - base.dy
              other = {
                ...other,
                outline: {
                  points: other.outline.points.map((pt) => ({
                    x: pt.x + odx,
                    y: pt.y + ody,
                  })),
                },
              }
            }
            if (piecesCollide(testPiece, other)) return true
          }
          return false
        }

        if (!collidesAt(targetDx, targetDy)) {
          next[idx] = { dx: targetDx, dy: targetDy }
          moved++
        } else {
          let lo = 0
          let hi = 1
          for (let it = 0; it < 18; it++) {
            const mid = (lo + hi) / 2
            const fx = current.dx + ddx * mid
            const fy = current.dy + ddy * mid
            if (!collidesAt(fx, fy)) lo = mid
            else hi = mid
          }
          if (lo > 1e-4) {
            next[idx] = {
              dx: current.dx + ddx * lo,
              dy: current.dy + ddy * lo,
            }
            moved++
          }
        }
      }

      if (moved === 0) {
        NestingToast.alignNone()
        return
      }
      history.commit("Alinear piezas", {
        positionOverrides: next,
        angleOverrides: history.angleOverrides,
      })
    },
    [history, canvasPieces, lockedPieceIndices],
  )

  const handleOverrideChange = useCallback(
    (
      selectedPieceIndices: number[],
      next: { dx: number; dy: number; angle: number },
    ) => {
      if (selectedPieceIndices.length === 0) return
      const idx = selectedPieceIndices[selectedPieceIndices.length - 1]
      const nextPos = {
        ...history.positionOverrides,
        [idx]: { dx: next.dx, dy: next.dy },
      }
      const nextAng = {
        ...history.angleOverrides,
        [idx]: ((next.angle % 360) + 360) % 360,
      }
      history.commit("Editar posición", {
        positionOverrides: nextPos,
        angleOverrides: nextAng,
      })
    },
    [history],
  )

  const handleResetOverrides = useCallback(
    (selectedPieceIndices: number[]) => {
      if (selectedPieceIndices.length === 0) return
      const nextPos = { ...history.positionOverrides }
      const nextAng = { ...history.angleOverrides }
      for (const idx of selectedPieceIndices) {
        delete nextPos[idx]
        delete nextAng[idx]
      }
      history.commit("Restablecer posición", {
        positionOverrides: nextPos,
        angleOverrides: nextAng,
      })
    },
    [history],
  )

  return {
    handleMovePieces,
    handleRotateSelected,
    handleRotateAroundPivot,
    handleAlign,
    handleOverrideChange,
    handleResetOverrides,
  }
}

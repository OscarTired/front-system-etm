"use client"

import { useCallback } from "react"
import { boundingRect, rotateOutlineAroundPoint } from "../engine/geometry"
import { piecesCollide } from "../engine/polygon-collision"
import type { PlacedPiece, PieceOutline, SheetConfig } from "../engine/types"
import { NestingToast } from "./nesting-feedback"

type HistoryLike = {
  positionOverrides: Record<number, { dx: number; dy: number }>
  angleOverrides: Record<number, number>
  commit: (
    label: string,
    snap: {
      positionOverrides: Record<number, { dx: number; dy: number }>
      angleOverrides: Record<number, number>
    },
  ) => void
}

function outlineInsideSheet(outline: PieceOutline, sheet: SheetConfig): boolean {
  const b = boundingRect(outline)
  const m = sheet.margin ?? 0
  return (
    b.x >= m - 0.05 &&
    b.y >= m - 0.05 &&
    b.x + b.width <= sheet.width - m + 0.05 &&
    b.y + b.height <= sheet.height - m + 0.05
  )
}

export function useCanvasPieceActions(opts: {
  history: HistoryLike
  canvasPieces: PlacedPiece[]
  rawPieces: PlacedPiece[]
  lockedPieceIndices: number[]
  sheetConfig: SheetConfig
}) {
  const { history, canvasPieces, rawPieces, lockedPieceIndices, sheetConfig } = opts

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

  const handleAlign = useCallback(
    (mode: "left" | "right" | "top" | "bottom" | "center-h" | "center-v") => {
      if (canvasPieces.length === 0) return
      // El caller debe haber validado selección ≥ 2; si no, toast
      NestingToast.alignNeedTwo()
    },
    [canvasPieces],
  )

  return { handleRotateSelected, outlineInsideSheet, NestingToast }
}

// silence unused toast import if tree-shaken

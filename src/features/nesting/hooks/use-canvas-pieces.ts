"use client"

import { useMemo } from "react"
import { boundingRect, rotateOutlineAroundPoint } from "../engine/geometry"
import type { PlacedPiece } from "../engine/types"

type SheetGroup = {
  sheet: { pieces: PlacedPiece[] }
} | null

/**
 * Aplica angleOverrides + positionOverrides sobre las piezas nestadas
 * de la plancha activa (misma lógica que tenía nesting-page inline).
 */
export function useCanvasPieces(
  activeGroup: SheetGroup,
  positionOverrides: Record<number, { dx: number; dy: number }>,
  angleOverrides: Record<number, number>,
): PlacedPiece[] {
  return useMemo(() => {
    const raw = activeGroup ? activeGroup.sheet.pieces : []
    return raw.map((p, i) => {
      const ang = angleOverrides[i] ?? 0
      const override = positionOverrides[i]
      let piece = p
      if (ang) {
        const b = boundingRect(p.outline)
        const pivot = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        piece = {
          ...p,
          angle: ((p.angle + ang) % 360 + 360) % 360,
          outline: rotateOutlineAroundPoint(p.outline, ang, pivot),
          subEntities: p.subEntities?.map((s) => ({
            ...s,
            outline: rotateOutlineAroundPoint(s.outline, ang, pivot),
          })),
        }
      }
      if (!override) return piece
      const { dx, dy } = override
      return {
        ...piece,
        x: piece.x + dx,
        y: piece.y + dy,
        outline: { points: piece.outline.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) },
        subEntities: piece.subEntities?.map((s) => ({
          ...s,
          outline: { points: s.outline.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) },
        })),
      }
    })
  }, [activeGroup, positionOverrides, angleOverrides])
}

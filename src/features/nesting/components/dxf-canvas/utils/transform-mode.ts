import type { TransformMode } from "../types/types"

/**
 * En modo geométrico solo se permite mover en un eje dominante
 * (como TruTops: libre vs ortogonal).
 */
export function constrainToMode(
  mode: TransformMode,
  dx: number,
  dy: number
): { dx: number; dy: number } {
  if (mode !== "geometric") return { dx, dy }
  if (Math.abs(dx) >= Math.abs(dy)) return { dx, dy: 0 }
  return { dx: 0, dy }
}

export function nextRotation(currentDeg: number, step: number): number {
  return ((currentDeg + step) % 360 + 360) % 360
}

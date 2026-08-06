import type { TransformMode } from "../components/dxf-canvas/types/types"

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

/** Distancia mínima (en unidades locales/mm) antes de decidir el eje. */
const AXIS_LOCK_THRESHOLD = 1.5

/**
 * Igual que `constrainToMode`, pero para modo "geometric" DECIDE el eje
 * una sola vez por gesto de arrastre y lo mantiene fijo, en vez de
 * recalcularlo en cada pointermove contra la distancia acumulada desde
 * el punto de inicio. Sin esto, cuando el cursor pasa cerca de la
 * diagonal (dx ≈ dy) un jitter mínimo del mouse hace que el eje
 * "ganador" cambie de golpe entre X e Y — la pieza se ve "tambalear"
 * saltando de eje en medio del arrastre.
 *
 * `currentLock` es el eje ya decidido para este gesto (null si aún no
 * se decidió). Devuelve tanto el dx/dy ya restringidos como el eje que
 * quedó fijado, para que el caller lo guarde en su ref de drag y lo
 * reutilice en el siguiente frame sin volver a decidir.
 */
export function resolveAxisLock(
  mode: TransformMode,
  dx: number,
  dy: number,
  currentLock: "x" | "y" | null
): { dx: number; dy: number; lock: "x" | "y" | null } {
  if (mode !== "geometric") return { dx, dy, lock: null }

  let lock = currentLock
  if (lock === null) {
    // Todavía no se movió lo suficiente para decidir con confianza:
    // no fuerces ningún eje aún (evita "lockear" en X por un pixel de
    // jitter justo al empezar el drag).
    if (Math.hypot(dx, dy) < AXIS_LOCK_THRESHOLD) return { dx, dy, lock: null }
    lock = Math.abs(dx) >= Math.abs(dy) ? "x" : "y"
  }

  return lock === "x" ? { dx, dy: 0, lock } : { dx: 0, dy, lock }
}

export function nextRotation(currentDeg: number, step: number): number {
  return ((currentDeg + step) % 360 + 360) % 360
}

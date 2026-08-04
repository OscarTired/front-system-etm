import { RectangleHeuristicStrategy } from "./strategies/rectangle-heuristic"
import { PolygonPackingStrategy } from "./strategies/polygon-packing"
import type { NestedSheet, NestingOptions, NestingPiece, NestingStrategy } from "./types"

const rectangleStrategy = new RectangleHeuristicStrategy()
const polygonStrategy = new PolygonPackingStrategy()

/**
 * Punto de entrada del motor.
 * - mode "fast" → bounding-box (rápido, como el original C++)
 * - mode "precise" (default) → polígono real + calados
 */
export function optimize(
  pieces: NestingPiece[],
  options: NestingOptions,
  strategy?: NestingStrategy
): NestedSheet[] {
  const chosen =
    strategy ??
    (options.mode === "fast" ? rectangleStrategy : polygonStrategy)
  return chosen.optimize(pieces, options)
}

export * from "./types"
export { RectangleHeuristicStrategy } from "./strategies/rectangle-heuristic"
export { PolygonPackingStrategy } from "./strategies/polygon-packing"

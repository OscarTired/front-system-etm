import { RectangleHeuristicStrategy } from "./strategies/rectangle-heuristic"
import { PolygonPackingStrategy } from "./strategies/polygon-packing"
import type { NestedSheet, NestingOptions, NestingPiece, NestingStrategy } from "./types"

const rectangleStrategy = new RectangleHeuristicStrategy()
const polygonStrategy = new PolygonPackingStrategy()

/**
 * - mode "fast" (default): AABB + candidatos de esquinas + nesting en calados (rápido)
 * - mode "precise": polígono real + grilla (más denso, mucho más lento; no usar en UI)
 */
export function optimize(
  pieces: NestingPiece[],
  options: NestingOptions,
  strategy?: NestingStrategy
): NestedSheet[] {
  const chosen =
    strategy ??
    (options.mode === "precise" ? polygonStrategy : rectangleStrategy)
  return chosen.optimize(pieces, options)
}

export * from "./types"
export { RectangleHeuristicStrategy } from "./strategies/rectangle-heuristic"
export { PolygonPackingStrategy } from "./strategies/polygon-packing"

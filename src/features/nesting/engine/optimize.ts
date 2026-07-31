import { RectangleHeuristicStrategy } from "./strategies/rectangle-heuristic";
import type { NestedSheet, NestingOptions, NestingPiece, NestingStrategy } from "./types";

const defaultStrategy = new RectangleHeuristicStrategy();

/**
 * Punto de entrada público del motor de nesting. Framework-agnostic:
 * puede llamarse desde el hilo principal, un Web Worker o un endpoint
 * de servidor — es una función pura, sin dependencias de DOM/React.
 *
 * El algoritmo es intercambiable vía `strategy` (patrón Strategy): hoy
 * el único disponible es RectangleHeuristicStrategy (bounding box). Si
 * más adelante se agrega nesting de polígono real, se pasa esa nueva
 * estrategia acá sin tocar el resto del código que ya usa `optimize`.
 */
export function optimize(
  pieces: NestingPiece[],
  options: NestingOptions,
  strategy: NestingStrategy = defaultStrategy
): NestedSheet[] {
  return strategy.optimize(pieces, options);
}

export * from "./types";
export { RectangleHeuristicStrategy } from "./strategies/rectangle-heuristic";

import {
  applyToOutline,
  boundingRect,
  compose,
  inflateRect,
  rectCenter,
  rectsOverlap,
  rotateAround,
  scaleUniform,
  translate,
  IDENTITY,
  type Transform2D,
} from "../geometry";
import {
  extractSolidWithHoles,
  pointInPolygon,
  type SolidWithHoles,
} from "../polygon-collision";
import type {
  NestedSheet,
  NestingOptions,
  NestingPiece,
  NestingStrategy,
  PieceOutline,
  PlacedPiece,
  Rect,
} from "../types";

interface RotationVariant {
  angle: number;
  outline: PieceOutline;
  bounds: Rect;
  transform: Transform2D;
}

function rotationAnglesFor(options: NestingOptions): number[] {
  const mode = options.rotationMode ?? "0-90-180-270";
  if (mode === "ninguna") return [0];
  // Rápido: siempre 90°. "libre" en settings no abre 15° aquí (CPU).
  return [0, 90, 180, 270];
}

function placePiece(
  piece: NestingPiece,
  variant: RotationVariant,
  x: number,
  y: number
): PlacedPiece {
  const finalTransform = compose(variant.transform, translate(x, y));
  return {
    pieceId: piece.id,
    x,
    y,
    angle: variant.angle,
    outline: applyToOutline(finalTransform, piece.outline),
    subEntities: piece.subEntities?.map((sub) => ({
      outline: applyToOutline(finalTransform, sub.outline),
      color: sub.color,
      layer: sub.layer,
    })),
    color: piece.color,
  };
}

function uniqSorted(arr: number[]): number[] {
  return [...new Set(arr.map((v) => Math.round(v * 100) / 100))].sort((a, b) => a - b);
}

/** 4 esquinas del AABB de la variante en (x,y). */
function aabbCorners(x: number, y: number, w: number, h: number) {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

/**
 * Nesting rápido estilo producción:
 * 1) Intento en calados (huecos) de piezas ya colocadas — candidatos en bbox del hueco.
 * 2) Colocación outer bottom-left por esquinas de AABB (sin grilla mm).
 */
export class RectangleHeuristicStrategy implements NestingStrategy {
  optimize(inputPieces: NestingPiece[], options: NestingOptions): NestedSheet[] {
    const { sheet, signal, onProgress } = options;
    const sheets: NestedSheet[] = [];
    const sheetSolids: SolidWithHoles[][] = [];
    const separation = options.separation ?? 0;
    const pad = Math.max(sheet.margin / 2, separation / 2);

    const pieces = inputPieces.flatMap((p) =>
      Array.from({ length: p.quantity ?? 1 }, () => p)
    );
    if (pieces.length === 0) return sheets;

    const sorted = [...pieces].sort((a, b) => {
      const boxA = boundingRect(a.outline);
      const boxB = boundingRect(b.outline);
      return boxB.width * boxB.height - boxA.width * boxA.height;
    });

    const usableWidth = sheet.width - 2 * sheet.margin;
    const usableHeight = sheet.height - 2 * sheet.margin;
    const limitX = sheet.width - sheet.margin;
    const limitY = sheet.height - sheet.margin;
    const angles = rotationAnglesFor(options);

    for (let i = 0; i < sorted.length; i++) {
      if (signal?.cancelled) break;
      onProgress?.(i / Math.max(1, sorted.length));

      const piece = sorted[i];
      let outline = piece.outline;
      let bounds = boundingRect(outline);
      let center = rectCenter(bounds);
      let scaleTransform: Transform2D = IDENTITY;

      const fitsNormal =
        bounds.width <= usableWidth + 0.1 && bounds.height <= usableHeight + 0.1;
      const fitsRotated =
        bounds.height <= usableWidth + 0.1 && bounds.width <= usableHeight + 0.1;

      if (!fitsNormal && !fitsRotated) {
        const scaleNormal = Math.min(
          usableWidth / bounds.width,
          usableHeight / bounds.height
        );
        const scaleRotated = Math.min(
          usableWidth / bounds.height,
          usableHeight / bounds.width
        );
        const scaleFactor = Math.max(scaleNormal, scaleRotated) * 0.99;
        scaleTransform = scaleUniform(scaleFactor);
        outline = applyToOutline(scaleTransform, outline);
        bounds = boundingRect(outline);
        center = rectCenter(bounds);
      }

      const variants: RotationVariant[] = angles.map((angle) => {
        const rotTransform = rotateAround(center, angle);
        const rotated = applyToOutline(rotTransform, outline);
        const rBounds = boundingRect(rotated);
        const alignTransform = translate(-rBounds.x, -rBounds.y);
        const aligned = applyToOutline(alignTransform, rotated);
        const fullTransform = compose(
          compose(scaleTransform, rotTransform),
          alignTransform
        );
        return {
          angle,
          outline: aligned,
          bounds: boundingRect(aligned),
          transform: fullTransform,
        };
      });

      variants.sort((a, b) => {
        if (Math.abs(a.bounds.width - b.bounds.width) > 0.1) {
          return a.bounds.width - b.bounds.width;
        }
        return a.bounds.height - b.bounds.height;
      });

      let placed = false;

      // A) Calados
      for (let si = 0; si < sheets.length && !placed; si++) {
        if (signal?.cancelled) break;
        const solids = sheetSolids[si];
        for (const host of solids) {
          if (placed) break;
          for (const hole of host.holes) {
            if (hole.length < 3) continue;
            const hb = boundingRect({ points: hole });
            if (hb.width < 1 || hb.height < 1) continue;

            for (const variant of variants) {
              if (placed) break;
              if (
                variant.bounds.width > hb.width + 0.1 ||
                variant.bounds.height > hb.height + 0.1
              ) {
                continue;
              }

              const xs = uniqSorted([
                hb.x,
                hb.x + hb.width - variant.bounds.width,
                hb.x + (hb.width - variant.bounds.width) / 2,
              ]);
              const ys = uniqSorted([
                hb.y,
                hb.y + hb.height - variant.bounds.height,
                hb.y + (hb.height - variant.bounds.height) / 2,
              ]);

              for (const x of xs) {
                if (placed) break;
                for (const y of ys) {
                  if (x < sheet.margin - 0.001 || y < sheet.margin - 0.001) continue;
                  if (x + variant.bounds.width > limitX + 0.001) continue;
                  if (y + variant.bounds.height > limitY + 0.001) continue;

                  const corners = aabbCorners(
                    x,
                    y,
                    variant.bounds.width,
                    variant.bounds.height
                  );
                  if (!corners.every((c) => pointInPolygon(c, hole))) continue;

                  const testRect = inflateRect(
                    {
                      x,
                      y,
                      width: variant.bounds.width,
                      height: variant.bounds.height,
                    },
                    pad
                  );
                  let clash = false;
                  for (let oi = 0; oi < sheets[si].pieces.length; oi++) {
                    if (solids[oi] === host) continue;
                    const ob = inflateRect(
                      boundingRect(sheets[si].pieces[oi].outline),
                      pad
                    );
                    if (rectsOverlap(testRect, ob)) {
                      clash = true;
                      break;
                    }
                  }
                  if (clash) continue;

                  const pp = placePiece(piece, variant, x, y);
                  sheets[si].pieces.push(pp);
                  sheetSolids[si].push(
                    extractSolidWithHoles(pp.outline, pp.subEntities)
                  );
                  placed = true;
                  break;
                }
              }
            }
          }
        }
      }

      // B) Outer por esquinas
      for (let si = 0; si < sheets.length && !placed; si++) {
        if (signal?.cancelled) break;

        const placedBounds = sheets[si].pieces.map((p) =>
          inflateRect(boundingRect(p.outline), pad)
        );

        const xs: number[] = [sheet.margin];
        const ys: number[] = [sheet.margin];
        for (const r of placedBounds) {
          xs.push(r.x + r.width);
          ys.push(r.y + r.height);
        }
        const candX = uniqSorted(xs);
        const candY = uniqSorted(ys);

        for (const y of candY) {
          if (placed) break;
          for (const x of candX) {
            if (placed) break;
            for (const variant of variants) {
              if (x + variant.bounds.width > limitX + 0.001) continue;
              if (y + variant.bounds.height > limitY + 0.001) continue;
              if (x < sheet.margin - 0.001 || y < sheet.margin - 0.001) continue;

              const testRect = inflateRect(
                {
                  x,
                  y,
                  width: variant.bounds.width,
                  height: variant.bounds.height,
                },
                pad
              );

              let collision = false;
              for (const placedRect of placedBounds) {
                if (rectsOverlap(testRect, placedRect)) {
                  collision = true;
                  break;
                }
              }
              if (collision) continue;

              const pp = placePiece(piece, variant, x, y);
              sheets[si].pieces.push(pp);
              sheetSolids[si].push(
                extractSolidWithHoles(pp.outline, pp.subEntities)
              );
              placed = true;
              break;
            }
          }
        }
      }

      // C) Nueva plancha
      if (!placed) {
        let bestVariant = variants[0];
        for (const variant of variants) {
          if (
            variant.bounds.width <= usableWidth + 0.1 &&
            variant.bounds.height <= usableHeight + 0.1
          ) {
            bestVariant = variant;
            break;
          }
        }
        const first = placePiece(piece, bestVariant, sheet.margin, sheet.margin);
        sheets.push({ pieces: [first] });
        sheetSolids.push([
          extractSolidWithHoles(first.outline, first.subEntities),
        ]);
      }
    }

    onProgress?.(1);
    return sheets;
  }
}
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
  /** Transform acumulado (escala + rotación + alineado a 0,0) SIN la traslación final de posición. Se aplica igual a `outline` y a `subOutlines`, para que el render fiel quede consistente con el bounding box usado para colisión. */
  transform: Transform2D;
}

const ROTATION_ANGLES = [0, 90, 180, 270] as const;
const SEARCH_STEP = 1.0; // mm — igual a pasoBusqueda en el original

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
    subOutlines: piece.subOutlines?.map((sub) => applyToOutline(finalTransform, sub)),
    color: piece.color,
  };
}

/**
 * Puerto del NestingEngine::optimizar original. Nesting por BOUNDING
 * BOX, no por polígono real: aproxima cada pieza a su rectángulo
 * envolvente para las pruebas de colisión. Rápido y suficiente para
 * piezas mayormente rectangulares; para piezas cóncavas con huecos no
 * aprovecha el material tan bien como un nesting de polígono real
 * (No-Fit-Polygon) — si eso se necesita en el futuro, se implementa
 * como otra clase que cumpla `NestingStrategy`, sin tocar el resto.
 */
export class RectangleHeuristicStrategy implements NestingStrategy {
  optimize(inputPieces: NestingPiece[], options: NestingOptions): NestedSheet[] {
    const { sheet, signal, onProgress } = options;
    const sheets: NestedSheet[] = [];

    // Expandir por `quantity`, igual que si el usuario hubiera repetido
    // la pieza N veces en la lista de entrada del C++ original.
    const pieces = inputPieces.flatMap((p) => Array.from({ length: p.quantity ?? 1 }, () => p));

    if (pieces.length === 0) return sheets;

    // 1. REGLA DE ORO DEL NESTING: ordenar de mayor a menor área.
    const sorted = [...pieces].sort((a, b) => {
      const boxA = boundingRect(a.outline);
      const boxB = boundingRect(b.outline);
      return boxB.width * boxB.height - boxA.width * boxA.height;
    });

    const usableWidth = sheet.width - 2 * sheet.margin;
    const usableHeight = sheet.height - 2 * sheet.margin;
    const limitX = sheet.width - sheet.margin;
    const limitY = sheet.height - sheet.margin;

    for (let i = 0; i < sorted.length; i++) {
      if (signal?.cancelled) break;
      onProgress?.(i / sorted.length);

      const piece = sorted[i];
      let outline = piece.outline;
      let bounds = boundingRect(outline);
      let center = rectCenter(bounds);
      let scaleTransform: Transform2D = IDENTITY;

      // ¿Cabe normal o rotada 90°? Si no cabe ninguna, escalar hasta que quepa.
      const fitsNormal = bounds.width <= usableWidth + 0.1 && bounds.height <= usableHeight + 0.1;
      const fitsRotated = bounds.height <= usableWidth + 0.1 && bounds.width <= usableHeight + 0.1;

      if (!fitsNormal && !fitsRotated) {
        const scaleNormal = Math.min(usableWidth / bounds.width, usableHeight / bounds.height);
        const scaleRotated = Math.min(usableWidth / bounds.height, usableHeight / bounds.width);
        const scaleFactor = Math.max(scaleNormal, scaleRotated) * 0.99;

        scaleTransform = scaleUniform(scaleFactor);
        outline = applyToOutline(scaleTransform, outline);
        bounds = boundingRect(outline);
        center = rectCenter(bounds);
      }

      // 2. Generar variantes de rotación (0°, 90°, 180°, 270°), alineadas a (0,0).
      const variants: RotationVariant[] = ROTATION_ANGLES.map((angle) => {
        const rotTransform = rotateAround(center, angle);
        const rotated = applyToOutline(rotTransform, outline);
        const rBounds = boundingRect(rotated);
        const alignTransform = translate(-rBounds.x, -rBounds.y);
        const aligned = applyToOutline(alignTransform, rotated);

        const fullTransform = compose(compose(scaleTransform, rotTransform), alignTransform);

        return { angle, outline: aligned, bounds: boundingRect(aligned), transform: fullTransform };
      });

      // 3. Priorizar variantes más angostas (fuerza la verticalidad).
      variants.sort((a, b) => {
        if (Math.abs(a.bounds.width - b.bounds.width) > 0.1) {
          return a.bounds.width - b.bounds.width;
        }
        return a.bounds.height - b.bounds.height;
      });

      let placed = false;

      // 4. Intentar acomodar en planchas existentes (izquierda a derecha, abajo a arriba).
      for (const existingSheet of sheets) {
        const placedBounds = existingSheet.pieces.map((p) =>
          inflateRect(boundingRect(p.outline), sheet.margin / 2)
        );

        for (let x = sheet.margin; x <= limitX + 0.001 && !placed; x += SEARCH_STEP) {
          let y = sheet.margin;

          while (y <= limitY + 0.001) {
            let minSafeYJump = limitY;
            let variantPlaced = false;

            for (const variant of variants) {
              if (x + variant.bounds.width > limitX + 0.001) continue;
              if (y + variant.bounds.height > limitY + 0.001) continue;

              const testRect: Rect = { x, y, width: variant.bounds.width, height: variant.bounds.height };
              const testRectWithMargin = inflateRect(testRect, sheet.margin / 2);

              let collision = false;
              let collisionYJump = 0;

              for (const placedRect of placedBounds) {
                if (rectsOverlap(testRectWithMargin, placedRect)) {
                  collision = true;
                  const jump = placedRect.y + placedRect.height - testRectWithMargin.y;
                  if (jump > collisionYJump) collisionYJump = jump;
                }
              }

              if (!collision) {
                existingSheet.pieces.push(placePiece(piece, variant, x, y));
                placed = true;
                variantPlaced = true;
                break;
              } else if (collisionYJump < minSafeYJump) {
                minSafeYJump = collisionYJump;
              }
            }

            if (variantPlaced) break;
            if (minSafeYJump === limitY) break; // Ninguna rotación entra en la altura restante
            y += Math.max(SEARCH_STEP, minSafeYJump);
          }
        }
      }

      // 5. Si no cupo en ninguna plancha, crear una nueva.
      if (!placed) {
        let bestVariant = variants[0];
        for (const variant of variants) {
          if (variant.bounds.width <= usableWidth + 0.1 && variant.bounds.height <= usableHeight + 0.1) {
            bestVariant = variant;
            break;
          }
        }

        sheets.push({ pieces: [placePiece(piece, bestVariant, sheet.margin, sheet.margin)] });
      }
    }

    onProgress?.(1);
    return sheets;
  }
}

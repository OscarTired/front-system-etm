import type { PieceOutline, Point2D, Rect } from "./types";

/**
 * Matriz de transformación afín 2D — equivalente a QTransform de Qt
 * para los casos que usa el motor original (traslación, rotación
 * alrededor de un punto, escala uniforme). Representada como matriz
 * homogénea 3x3 aplanada:
 *   x' = a*x + c*y + e
 *   y' = b*x + d*y + f
 */
export interface Transform2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const IDENTITY: Transform2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export function translate(tx: number, ty: number): Transform2D {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

export function scaleUniform(s: number): Transform2D {
  return { a: s, b: 0, c: 0, d: s, e: 0, f: 0 };
}

/** Rotación en grados alrededor del origen (0,0). */
export function rotateDeg(deg: number): Transform2D {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

/** Compone dos transformaciones: aplica m1 y luego m2 (equivalente a m2 * m1). */
export function compose(m1: Transform2D, m2: Transform2D): Transform2D {
  return {
    a: m2.a * m1.a + m2.c * m1.b,
    b: m2.b * m1.a + m2.d * m1.b,
    c: m2.a * m1.c + m2.c * m1.d,
    d: m2.b * m1.c + m2.d * m1.d,
    e: m2.a * m1.e + m2.c * m1.f + m2.e,
    f: m2.b * m1.e + m2.d * m1.f + m2.f,
  };
}

export function applyToPoint(m: Transform2D, p: Point2D): Point2D {
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
  };
}

export function applyToOutline(m: Transform2D, outline: PieceOutline): PieceOutline {
  return { points: outline.points.map((p) => applyToPoint(m, p)) };
}

/**
 * Traslada al origen + rota + traslada de vuelta. Equivalente al
 * patrón `translate(cx,cy) -> rotate(ang) -> translate(-cx,-cy)` que
 * usa NestingEngine.cpp para rotar sobre el centro de la pieza.
 */
export function rotateAround(center: Point2D, deg: number): Transform2D {
  return compose(compose(translate(-center.x, -center.y), rotateDeg(deg)), translate(center.x, center.y));
}

export function boundingRect(outline: PieceOutline): Rect {
  const { points } = outline;
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function rectCenter(r: Rect): Point2D {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/**
 * Expande (o contrae, si amount es negativo) un rectángulo en las 4
 * direcciones por `amount`. Equivalente a `QRectF::adjusted(-a,-a,a,a)`
 * del original.
 */
export function inflateRect(r: Rect, amount: number): Rect {
  return {
    x: r.x - amount,
    y: r.y - amount,
    width: r.width + amount * 2,
    height: r.height + amount * 2,
  };
}

/**
 * ¿Se solapan dos rectángulos? Colisión AABB estándar — misma
 * tolerancia (0.001) que la comparación manual del C++ original.
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  return !(
    aRight <= b.x + 0.001 ||
    a.x >= bRight - 0.001 ||
    aBottom <= b.y + 0.001 ||
    a.y >= bBottom - 0.001
  );
}

/** Suma la longitud de los segmentos consecutivos de un contorno (aproximación del perímetro real, ya que el contorno está tesselado a puntos). */
export function perimeterOf(outline: PieceOutline): number {
  const pts = outline.points;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  }
  return total;
}
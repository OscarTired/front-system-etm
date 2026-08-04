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

/** Rota un contorno `degrees` grados sobre el centro de su propio bounding box (no sobre el origen) — así "rotar 90°" gira la pieza en su lugar, no la manda lejos del resto. */
/** Rota un contorno `degrees` grados alrededor de un punto arbitrario — no necesariamente el centro de la propia pieza. Para rotar VARIAS piezas juntas alrededor del centro combinado de la selección (mismo comportamiento que "Rotar" en FreeCAD con selección múltiple). */
export function rotateOutlineAroundPoint(outline: PieceOutline, degrees: number, pivot: Point2D): PieceOutline {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    points: outline.points.map((p) => {
      const dx = p.x - pivot.x;
      const dy = p.y - pivot.y;
      return { x: pivot.x + dx * cos - dy * sin, y: pivot.y + dx * sin + dy * cos };
    }),
  };
}

/** Rota un contorno `degrees` grados sobre el centro de su propio bounding box (no sobre el origen) — así "rotar 90°" gira la pieza en su lugar, no la manda lejos del resto. */
export function rotateOutline(outline: PieceOutline, degrees: number): PieceOutline {
  const b = boundingRect(outline);
  return rotateOutlineAroundPoint(outline, degrees, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
}

/** Espeja un contorno horizontalmente (invierte X) sobre el centro de su bounding box. */
export function mirrorOutlineX(outline: PieceOutline): PieceOutline {
  const b = boundingRect(outline);
  const cx = b.x + b.width / 2;
  return { points: outline.points.map((p) => ({ x: 2 * cx - p.x, y: p.y })) };
}

/** Espeja un contorno verticalmente (invierte Y) sobre el centro de su bounding box. */
export function mirrorOutlineY(outline: PieceOutline): PieceOutline {
  const b = boundingRect(outline);
  const cy = b.y + b.height / 2;
  return { points: outline.points.map((p) => ({ x: p.x, y: 2 * cy - p.y })) };
}

/** Ray casting estándar: ¿el punto está dentro del polígono? Compartida — antes vivía duplicada adentro de dxf-canvas.tsx. */
export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** ¿Se cruzan los segmentos a1-a2 y b1-b2? Test estándar por orientación de triples de puntos. */
function segmentsIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
  const orientation = (p: Point2D, q: Point2D, r: Point2D) => {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (Math.abs(val) < 1e-9) return 0;
    return val > 0 ? 1 : 2;
  };
  const onSegment = (p: Point2D, q: Point2D, r: Point2D) =>
    q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);

  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a1, b1, a2)) return true;
  if (o2 === 0 && onSegment(a1, b2, a2)) return true;
  if (o3 === 0 && onSegment(b1, a1, b2)) return true;
  if (o4 === 0 && onSegment(b1, a2, b2)) return true;
  return false;
}

/**
 * ¿Se solapan dos polígonos de verdad (no solo sus bounding boxes)?
 * Revisa: (1) algún par de aristas se cruza, (2) un polígono está
 * completamente adentro del otro (caso sin cruce de aristas).
 */
export function polygonsOverlap(a: Point2D[], b: Point2D[]): boolean {
  if (a.length < 3 || b.length < 3) return false;

  const boundsA = boundingRect({ points: a });
  const boundsB = boundingRect({ points: b });
  if (!rectsOverlap(boundsA, boundsB)) return false;

  for (let i = 0; i < a.length; i++) {
    const a1 = a[i];
    const a2 = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j];
      const b2 = b[(j + 1) % b.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }

  return pointInPolygon(a[0], b) || pointInPolygon(b[0], a);
}

/**
 * Puentes/micro-uniones de corte: parte un contorno CERRADO en N
 * segmentos abiertos, dejando huecos chicos evenly-spaced por
 * LONGITUD DE PERÍMETRO real (no por cantidad de puntos, que daría
 * huecos de tamaño desparejo en tramos rectos vs curvos). El
 * resultado son N contornos abiertos — la máquina corta cada uno y
 * salta el huequito entre ellos, así la pieza no se suelta sola y
 * cae dentro de la máquina durante el corte.
 *
 * Recorre el contorno una sola vez acumulando longitud, partiendo
 * exactamente en los bordes de cada hueco (con el punto interpolado,
 * no el vértice más cercano).
 */
export function applyCutBridges(outline: PieceOutline, bridgeCount: number, bridgeWidthMm: number): PieceOutline[] {
  const pts = outline.points;
  if (bridgeCount <= 0 || pts.length < 3) return [outline];

  const closed = [...pts];
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (Math.abs(first.x - last.x) > 1e-6 || Math.abs(first.y - last.y) > 1e-6) closed.push(first);

  const perimeter = perimeterOf({ points: closed });
  if (perimeter <= bridgeWidthMm * bridgeCount) return [outline];

  const step = perimeter / bridgeCount;
  const gaps = Array.from({ length: bridgeCount }, (_, i) => {
    const center = step / 2 + i * step;
    return { start: center - bridgeWidthMm / 2, end: center + bridgeWidthMm / 2 };
  });

  const interpolateAt = (targetLen: number): Point2D => {
    let acc = 0;
    for (let i = 0; i < closed.length - 1; i++) {
      const p1 = closed[i], p2 = closed[i + 1];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (acc + segLen >= targetLen - 1e-9) {
        const t = segLen > 0 ? (targetLen - acc) / segLen : 0;
        return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
      }
      acc += segLen;
    }
    return closed[closed.length - 1];
  };

  const isInGap = (len: number) => gaps.some((g) => len >= g.start && len < g.end);

  const segments: Point2D[][] = [];
  let current: Point2D[] = [];
  let acc = 0;
  const startedInGap = isInGap(0);
  if (!startedInGap) current.push(closed[0]);

  for (let i = 0; i < closed.length - 1; i++) {
    const p1 = closed[i], p2 = closed[i + 1];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const segStart = acc;
    const segEnd = acc + segLen;

    const boundaries = gaps
      .flatMap((g) => [g.start, g.end])
      .filter((b) => b > segStart && b < segEnd)
      .sort((a, b) => a - b);

    for (const b of boundaries) {
      const point = interpolateAt(b);
      const inGapJustBefore = isInGap(b - 1e-6);
      if (inGapJustBefore) {
        current = [point]; // salimos de un hueco -> arranca segmento nuevo
      } else {
        current.push(point); // entramos a un hueco -> cerramos el segmento actual
        if (current.length >= 2) segments.push(current);
        current = [];
      }
    }

    if (!isInGap(segEnd)) current.push(p2);
    acc = segEnd;
  }

  if (current.length >= 2) segments.push(current);

  // Si el contorno arrancó FUERA de un hueco (en material), el primer
  // y el último segmento pusheados son en realidad las dos mitades de
  // un mismo tramo de material — la lista de puntos original es
  // circular, pero acá se recorrió como una lista lineal con una
  // costura artificial en el punto 0. Hay que unirlos, sacando el
  // punto duplicado de la costura (el último punto del último
  // segmento y el primer punto del primero son el mismo punto físico).
  if (!startedInGap && segments.length > 1) {
    const firstSeg = segments.shift()!;
    const lastSeg = segments.pop()!;
    segments.push([...lastSeg, ...firstSeg.slice(1)]);
  }

  return segments.length > 0 ? segments.map((points) => ({ points })) : [outline];
}
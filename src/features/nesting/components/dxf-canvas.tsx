'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Target, Grid, Ruler, CircleDot, Triangle, Square, Crosshair, X, Trash2 } from 'lucide-react';

interface Point { x: number; y: number }
interface ViewState { scale: number; offsetX: number; offsetY: number }

// Entidad de dibujo interna del canvas. `pieceIndex` agrupa entidades
// por pieza para poder hacer hit-test/selección. `layer` es el nombre
// de capa original del DXF/GEO, para el gestor de capas.
type Entity =
  | { kind: 'line'; a: Point; b: Point; color: string; pieceIndex?: number; layer?: string }
  | { kind: 'polyline'; points: Point[]; closed: boolean; color: string; pieceIndex?: number; layer?: string }
  | { kind: 'circle'; center: Point; radius: number; color: string; pieceIndex?: number; layer?: string }
  | { kind: 'arc'; center: Point; radius: number; startAngle: number; endAngle: number; color: string; pieceIndex?: number; layer?: string }
  | { kind: 'text'; position: Point; text: string; height: number; color: string; pieceIndex?: number; layer?: string };

function computeBounds(entities: Entity[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const expand = (p: Point) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  };

  for (const e of entities) {
    if (e.kind === 'line') { expand(e.a); expand(e.b); }
    else if (e.kind === 'polyline') e.points.forEach(expand);
    else if (e.kind === 'circle') {
      expand({ x: e.center.x - e.radius, y: e.center.y - e.radius });
      expand({ x: e.center.x + e.radius, y: e.center.y + e.radius });
    } else if (e.kind === 'arc') {
      expand({ x: e.center.x - e.radius, y: e.center.y - e.radius });
      expand({ x: e.center.x + e.radius, y: e.center.y + e.radius });
    } else if (e.kind === 'text') expand(e.position);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { minX, minY, maxX, maxY };
}

/** Ray casting estándar para hit-test de selección de pieza. */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Área por la fórmula del shoelace (con signo; se devuelve el valor absoluto). */
function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(sum) / 2;
}

function polygonPerimeter(points: Point[]): number {
  let total = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    total += Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }
  return total;
}

export interface NestingPieceInput {
  /** Puntos del contorno de cada sub-trazo de la pieza, con su color real y su capa original (para el gestor de capas). */
  subOutlines: { points: Point[]; color?: string; layer?: string }[];
  /** Contorno fusionado, usado solo como respaldo para hit-test si no hay subOutlines. */
  outline?: Point[];
  angle?: number;
}

export interface LayerInfo {
  key: string
  label: string
  color: string
  count: number
}

/** Recorre las piezas y arma la lista de capas distintas (agrupadas por nombre de capa real del DXF, o por color si la entidad no tiene capa) — para el gestor de capas. */
export function computeLayerList(pieces: NestingPieceInput[]): LayerInfo[] {
  const map = new Map<string, LayerInfo>()
  for (const piece of pieces) {
    for (const sub of piece.subOutlines) {
      const color = sub.color ?? '#22c55e'
      const key = sub.layer ?? color
      const existing = map.get(key)
      if (existing) {
        existing.count++
      } else {
        map.set(key, { key, label: sub.layer ?? color, color, count: 1 })
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
}

interface DxfCanvasProps {
  pieces: NestingPieceInput[];
  /** Tamaño de la plancha — dibuja un rectángulo gris claro de fondo. */
  sheetSize?: { width: number; height: number };
  /** Índices de las piezas seleccionadas (soporta selección múltiple, para alinear varias entre sí). */
  selectedPieceIndices?: number[];
  /** Se dispara al hacer click sobre una pieza (o vacío = null). `additive` es true con shift/ctrl — suma a la selección en vez de reemplazarla. */
  onSelectPiece?: (index: number | null, additive: boolean) => void;
  /** Claves (nombre de capa, o color en hex mayúsculas si la entidad no tiene capa) a ocultar — para el gestor de capas/filtros de color. */
  hiddenKeys?: string[];
}

const SHEET_STROKE = '#71717a';
const SELECTED_STROKE = '#ffffff';
const SELECTED_HALO = '#facc15';
const MEASURE_COLOR = '#22d3ee';
const MEASURE_PENDING_COLOR = '#67e8f9';

// --- Metrología ---

type MeasureTool = 'none' | 'distance' | 'radius' | 'angle' | 'area' | 'coords';

type Measurement =
  | { id: string; kind: 'distance'; a: Point; b: Point; value: number }
  | { id: string; kind: 'radius'; center: Point; radius: number; anglePoint: Point }
  | { id: string; kind: 'angle'; vertex: Point; p1: Point; p2: Point; degrees: number }
  | { id: string; kind: 'area'; points: Point[]; area: number; perimeter: number; centroid: Point };

const TOOL_LABELS: Record<Exclude<MeasureTool, 'none'>, string> = {
  distance: 'Distancia',
  radius: 'Radio / diámetro',
  angle: 'Ángulo',
  area: 'Área / perímetro',
  coords: 'Coordenadas',
};

/** Tolerancia de hit-test en px de pantalla, convertida a espacio local según el zoom actual. */
const HIT_TOLERANCE_PX = 10;

function angleOfVector(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function fmtMm(v: number): string {
  return `${v.toFixed(1)}mm`;
}

export const DxfCanvas = ({ pieces, sheetSize, selectedPieceIndices = [], onSelectPiece, hiddenKeys }: DxfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const viewRef = useRef<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const draggingRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number; moved: boolean } | null>(null);

  const [showGrid, setShowGrid] = useState(true);

  const [activeTool, setActiveTool] = useState<MeasureTool>('none');
  const [pendingPoints, setPendingPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [hoverLocal, setHoverLocal] = useState<Point | null>(null);
  const [hoverScreen, setHoverScreen] = useState<Point | null>(null);

  const localToScreen = useCallback((p: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const { scale, offsetX, offsetY } = viewRef.current;
    return {
      x: w / 2 + offsetX + p.x * scale,
      y: h / 2 + offsetY + p.y * scale,
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { scale, offsetX, offsetY } = viewRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
    ctx.scale(scale, scale);

    if (sheetSize) {
      ctx.strokeStyle = SHEET_STROKE;
      ctx.lineWidth = 1 / scale;
      ctx.strokeRect(0, 0, sheetSize.width, sheetSize.height);
    }

    ctx.lineWidth = 1 / scale;

    const selectedSet = new Set(selectedPieceIndices);

    for (const e of entitiesRef.current) {
      const isSelected = e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex);
      ctx.strokeStyle = isSelected ? SELECTED_STROKE : e.color;
      ctx.fillStyle = e.color;
      ctx.lineWidth = (isSelected ? 1.8 : 1) / scale;
      ctx.beginPath();
      if (e.kind === 'line') {
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      } else if (e.kind === 'polyline') {
        e.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        if (e.closed) ctx.closePath();
        ctx.stroke();
      } else if (e.kind === 'circle') {
        ctx.arc(e.center.x, e.center.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.kind === 'arc') {
        ctx.arc(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle);
        ctx.stroke();
      } else if (e.kind === 'text') {
        ctx.save();
        ctx.font = `${e.height}px sans-serif`;
        ctx.fillText(e.text, e.position.x, e.position.y);
        ctx.restore();
      }
    }

    for (const idx of selectedPieceIndices) {
      const selectedEntities = entitiesRef.current.filter((e) => e.pieceIndex === idx);
      const bounds = computeBounds(selectedEntities);
      if (bounds) {
        const pad = 3 / scale;
        ctx.strokeStyle = SELECTED_HALO;
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.strokeRect(
          bounds.minX - pad,
          bounds.minY - pad,
          bounds.maxX - bounds.minX + pad * 2,
          bounds.maxY - bounds.minY + pad * 2
        );
        ctx.setLineDash([]);
      }
    }

    // --- Geometría de mediciones (en espacio local, escala con el zoom) ---
    ctx.lineWidth = 1.5 / scale;
    ctx.strokeStyle = MEASURE_COLOR;
    ctx.fillStyle = MEASURE_COLOR;

    for (const m of measurements) {
      if (m.kind === 'distance') {
        ctx.setLineDash([5 / scale, 4 / scale]);
        ctx.beginPath();
        ctx.moveTo(m.a.x, m.a.y);
        ctx.lineTo(m.b.x, m.b.y);
        ctx.stroke();
        ctx.setLineDash([]);
        for (const p of [m.a, m.b]) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 / scale, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (m.kind === 'radius') {
        ctx.setLineDash([4 / scale, 3 / scale]);
        ctx.beginPath();
        ctx.moveTo(m.center.x, m.center.y);
        ctx.lineTo(m.anglePoint.x, m.anglePoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(m.center.x, m.center.y, 2.5 / scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.kind === 'angle') {
        ctx.setLineDash([4 / scale, 3 / scale]);
        ctx.beginPath();
        ctx.moveTo(m.vertex.x, m.vertex.y);
        ctx.lineTo(m.p1.x, m.p1.y);
        ctx.moveTo(m.vertex.x, m.vertex.y);
        ctx.lineTo(m.p2.x, m.p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const r = 14 / scale;
        const a1 = angleOfVector(m.vertex, m.p1);
        const a2 = angleOfVector(m.vertex, m.p2);
        ctx.beginPath();
        ctx.arc(m.vertex.x, m.vertex.y, r, a1, a2);
        ctx.stroke();
      } else if (m.kind === 'area') {
        ctx.fillStyle = `${MEASURE_COLOR}22`;
        ctx.strokeStyle = MEASURE_COLOR;
        ctx.beginPath();
        m.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Puntos ya colocados de la medición en curso
    if (pendingPoints.length > 0) {
      ctx.fillStyle = MEASURE_PENDING_COLOR;
      ctx.strokeStyle = MEASURE_PENDING_COLOR;
      ctx.setLineDash([4 / scale, 3 / scale]);
      ctx.beginPath();
      pendingPoints.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (hoverLocal) ctx.lineTo(hoverLocal.x, hoverLocal.y);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const p of pendingPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 / scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // --- Etiquetas de texto de las mediciones, en espacio de PANTALLA
    // (tamaño constante sin importar el zoom, como en cualquier CAD real) ---
    if (measurements.length > 0) {
      ctx.font = '11px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const m of measurements) {
        let labelLocal: Point;
        let text: string;

        if (m.kind === 'distance') {
          labelLocal = { x: (m.a.x + m.b.x) / 2, y: (m.a.y + m.b.y) / 2 };
          text = fmtMm(m.value);
        } else if (m.kind === 'radius') {
          labelLocal = m.anglePoint;
          text = `R${m.radius.toFixed(1)} · ⌀${(m.radius * 2).toFixed(1)}`;
        } else if (m.kind === 'angle') {
          const midAngle = (angleOfVector(m.vertex, m.p1) + angleOfVector(m.vertex, m.p2)) / 2;
          labelLocal = { x: m.vertex.x + Math.cos(midAngle) * 24, y: m.vertex.y + Math.sin(midAngle) * 24 };
          text = `${m.degrees.toFixed(1)}°`;
        } else {
          labelLocal = m.centroid;
          text = `${(m.area / 1_000_000).toFixed(4)}m² · P ${fmtMm(m.perimeter)}`;
        }

        const screenPos = localToScreen(labelLocal);
        const metrics = ctx.measureText(text);
        const pad = 4;
        ctx.fillStyle = 'rgba(10,10,12,0.85)';
        ctx.fillRect(screenPos.x - metrics.width / 2 - pad, screenPos.y - 9, metrics.width + pad * 2, 18);
        ctx.fillStyle = MEASURE_COLOR;
        ctx.fillText(text, screenPos.x, screenPos.y);
      }
    }

    // HUD de coordenadas en vivo (solo mientras la herramienta "coords" está activa)
    if (activeTool === 'coords' && hoverLocal && hoverScreen) {
      const text = `X ${hoverLocal.x.toFixed(1)}  Y ${hoverLocal.y.toFixed(1)}`;
      ctx.font = '11px ui-sans-serif, system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const metrics = ctx.measureText(text);
      const px = hoverScreen.x + 14;
      const py = hoverScreen.y - 10;
      ctx.fillStyle = 'rgba(10,10,12,0.85)';
      ctx.fillRect(px - 4, py - 16, metrics.width + 8, 20);
      ctx.fillStyle = MEASURE_COLOR;
      ctx.fillText(text, px, py);
    }
  }, [sheetSize, selectedPieceIndices, measurements, pendingPoints, hoverLocal, hoverScreen, activeTool, localToScreen]);

  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    const bounds = sheetSize
      ? { minX: 0, minY: 0, maxX: sheetSize.width, maxY: sheetSize.height }
      : computeBounds(entitiesRef.current);
    if (!bounds) return;

    const drawW = bounds.maxX - bounds.minX || 1;
    const drawH = bounds.maxY - bounds.minY || 1;
    const padding = 0.9;

    const scale = Math.min((w / drawW) * padding, (h / drawH) * padding);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    viewRef.current = {
      scale,
      offsetX: -centerX * scale,
      offsetY: -centerY * scale,
    };
    draw();
  }, [draw, sheetSize]);

  // Centrar cámara en las piezas seleccionadas actualmente (bounding box combinado si hay varias)
  const focusOnSelectedPiece = useCallback(() => {
    if (selectedPieceIndices.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    const selectedSet = new Set(selectedPieceIndices);
    const selectedEntities = entitiesRef.current.filter((e) => e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex));
    const bounds = computeBounds(selectedEntities);
    if (!bounds) return;

    const drawW = bounds.maxX - bounds.minX || 1;
    const drawH = bounds.maxY - bounds.minY || 1;
    const padding = 0.6; // Mayor zoom para enfocar la pieza

    const scale = Math.min((w / drawW) * padding, (h / drawH) * padding);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    viewRef.current = {
      scale,
      offsetX: -centerX * scale,
      offsetY: -centerY * scale,
    };
    draw();
  }, [draw, selectedPieceIndices]);

  useEffect(() => {
    const hidden = new Set((hiddenKeys ?? []).map((k) => k.toUpperCase()));
    const out: Entity[] = [];
    pieces.forEach((piece, pieceIndex) => {
      if (piece.subOutlines.length > 0) {
        for (const sub of piece.subOutlines) {
          const color = sub.color ?? '#22c55e';
          const layerKey = (sub.layer ?? color).toUpperCase();
          if (hidden.has(layerKey) || hidden.has(color.toUpperCase())) continue;
          if (sub.points.length >= 2) {
            out.push({ kind: 'polyline', points: sub.points, closed: false, color, pieceIndex, layer: sub.layer });
          }
        }
      } else if (piece.outline && piece.outline.length >= 2) {
        out.push({ kind: 'polyline', points: piece.outline, closed: true, color: '#22c55e', pieceIndex });
      }
    });
    entitiesRef.current = out;
    requestAnimationFrame(fitToView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, sheetSize?.width, sheetSize?.height, hiddenKeys]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  const screenToLocal = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { scale, offsetX, offsetY } = viewRef.current;
    const cx = clientX - rect.left - rect.width / 2 - offsetX;
    const cy = clientY - rect.top - rect.height / 2 - offsetY;
    return { x: cx / scale, y: cy / scale };
  }, []);

  /** Busca un círculo/arco cerca del punto (tolerancia en px de pantalla). */
  const hitTestCircleOrArc = useCallback((point: Point): { center: Point; radius: number } | null => {
    const tol = HIT_TOLERANCE_PX / viewRef.current.scale;
    for (const e of entitiesRef.current) {
      if (e.kind !== 'circle' && e.kind !== 'arc') continue;
      const dist = Math.hypot(point.x - e.center.x, point.y - e.center.y);
      if (Math.abs(dist - e.radius) <= tol) return { center: e.center, radius: e.radius };
    }
    return null;
  }, []);

  /** Busca un contorno cerrado que contenga el punto. */
  const hitTestClosedContour = useCallback((point: Point): Point[] | null => {
    for (const e of entitiesRef.current) {
      if (e.kind !== 'polyline' || !e.closed || e.points.length < 3) continue;
      if (pointInPolygon(point, e.points)) return e.points;
    }
    return null;
  }, []);

  const resetTool = useCallback(() => {
    setActiveTool('none');
    setPendingPoints([]);
  }, []);

  const handleToolClick = useCallback((point: Point) => {
    if (activeTool === 'distance') {
      const next = [...pendingPoints, point];
      if (next.length < 2) {
        setPendingPoints(next);
        return;
      }
      const [a, b] = next;
      setMeasurements((prev) => [...prev, {
        id: `d-${Date.now()}`, kind: 'distance', a, b, value: Math.hypot(b.x - a.x, b.y - a.y),
      }]);
      setPendingPoints([]);
    } else if (activeTool === 'radius') {
      const hit = hitTestCircleOrArc(point);
      if (!hit) return;
      setMeasurements((prev) => [...prev, {
        id: `r-${Date.now()}`, kind: 'radius', center: hit.center, radius: hit.radius, anglePoint: point,
      }]);
    } else if (activeTool === 'angle') {
      const next = [...pendingPoints, point];
      if (next.length < 3) {
        setPendingPoints(next);
        return;
      }
      const [vertex, p1, p2] = next;
      const a1 = angleOfVector(vertex, p1);
      const a2 = angleOfVector(vertex, p2);
      let degrees = Math.abs((a2 - a1) * (180 / Math.PI));
      if (degrees > 180) degrees = 360 - degrees;
      setMeasurements((prev) => [...prev, {
        id: `a-${Date.now()}`, kind: 'angle', vertex, p1, p2, degrees,
      }]);
      setPendingPoints([]);
    } else if (activeTool === 'area') {
      const contour = hitTestClosedContour(point);
      if (!contour) return;
      const area = polygonArea(contour);
      const perimeter = polygonPerimeter(contour);
      const centroid = contour.reduce((acc, p) => ({ x: acc.x + p.x / contour.length, y: acc.y + p.y / contour.length }), { x: 0, y: 0 });
      setMeasurements((prev) => [...prev, {
        id: `ar-${Date.now()}`, kind: 'area', points: contour, area, perimeter, centroid,
      }]);
    }
  }, [activeTool, pendingPoints, hitTestCircleOrArc, hitTestClosedContour]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: viewRef.current.offsetX,
        startOffsetY: viewRef.current.offsetY,
        moved: false,
      };
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (activeTool !== 'none') {
        const point = screenToLocal(e.clientX, e.clientY);
        const rect = canvas.getBoundingClientRect();
        setHoverLocal(point);
        setHoverScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }

      const drag = draggingRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
      viewRef.current = { ...viewRef.current, offsetX: drag.startOffsetX + dx, offsetY: drag.startOffsetY + dy };
      draw();
    };
    const onPointerUp = (e: PointerEvent) => {
      const drag = draggingRef.current;
      draggingRef.current = null;
      if (!drag) return;

      if (!drag.moved) {
        const point = screenToLocal(e.clientX, e.clientY);
        if (!point) return;

        if (activeTool !== 'none' && activeTool !== 'coords') {
          handleToolClick(point);
          return;
        }

        if (activeTool === 'none' && onSelectPiece) {
          let hit: number | null = null;
          for (const ent of entitiesRef.current) {
            if (ent.kind === 'polyline' && ent.pieceIndex !== undefined && ent.points.length >= 3) {
              if (pointInPolygon(point, ent.points)) hit = ent.pieceIndex;
            }
          }
          onSelectPiece(hit, e.shiftKey || e.ctrlKey || e.metaKey);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const { scale, offsetX, offsetY } = viewRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = scale * factor;
      viewRef.current = {
        scale: newScale,
        offsetX: cx - (cx - offsetX) * factor,
        offsetY: cy - (cy - offsetY) * factor,
      };
      draw();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [draw, onSelectPiece, screenToLocal, activeTool, handleToolClick]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.25 : 0.8;
    viewRef.current = { ...viewRef.current, scale: viewRef.current.scale * factor };
    draw();
  }, [draw]);

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{
        backgroundColor: '#0a0a0c',
        backgroundImage: showGrid ? 'radial-gradient(circle, #3a3a3f 1.5px, transparent 1.5px)' : 'none',
        backgroundSize: '24px 24px',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" />

      <div className="absolute right-6 top-6 flex flex-col gap-1 rounded-xl bg-[#101012]/90 p-1.5 ring-1 ring-white/10 backdrop-blur-sm">
        <button onClick={() => handleZoom('in')} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white" title="Acercar">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => handleZoom('out')} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white" title="Alejar">
          <ZoomOut size={16} />
        </button>

        <div className="my-0.5 h-px bg-white/10" />

        <button onClick={fitToView} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white" title="Ajustar a la vista">
          <Maximize size={16} />
        </button>

        <button
          onClick={focusOnSelectedPiece}
          disabled={selectedPieceIndices.length === 0}
          className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          title="Centrar en pieza seleccionada"
        >
          <Target size={16} />
        </button>

        <div className="my-0.5 h-px bg-white/10" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`rounded-lg p-2 hover:bg-white/10 hover:text-white ${showGrid ? 'text-white bg-white/5' : 'text-neutral-500'}`}
          title="Alternar cuadrícula"
        >
          <Grid size={16} />
        </button>
      </div>

      {/* Metrología */}
      <div className="absolute left-6 top-6 flex flex-col gap-1 rounded-xl bg-[#101012]/90 p-1.5 ring-1 ring-white/10 backdrop-blur-sm">
        {(
          [
            ['distance', Ruler],
            ['radius', CircleDot],
            ['angle', Triangle],
            ['area', Square],
            ['coords', Crosshair],
          ] as const
        ).map(([tool, Icon]) => (
          <button
            key={tool}
            onClick={() => {
              if (activeTool === tool) {
                resetTool();
              } else {
                setActiveTool(tool);
                setPendingPoints([]);
              }
            }}
            className={`rounded-lg p-2 transition-colors ${activeTool === tool ? 'bg-cyan-500/20 text-cyan-300' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
            title={TOOL_LABELS[tool]}
          >
            <Icon size={16} />
          </button>
        ))}
        {activeTool !== 'none' && (
          <>
            <div className="my-0.5 h-px bg-white/10" />
            <button onClick={resetTool} className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white" title="Salir de la herramienta">
              <X size={16} />
            </button>
          </>
        )}
      </div>

      {activeTool !== 'none' && (
        <div className="absolute left-6 top-24 max-w-[200px] rounded-lg bg-[#101012]/90 px-2.5 py-1.5 text-[11px] text-neutral-400 ring-1 ring-white/10 backdrop-blur-sm">
          {activeTool === 'distance' && (pendingPoints.length === 0 ? 'Clic en el primer punto' : 'Clic en el segundo punto')}
          {activeTool === 'radius' && 'Clic sobre un círculo o arco'}
          {activeTool === 'angle' && (pendingPoints.length === 0 ? 'Clic en el vértice' : pendingPoints.length === 1 ? 'Clic en el primer punto' : 'Clic en el segundo punto')}
          {activeTool === 'area' && 'Clic dentro de un contorno cerrado'}
          {activeTool === 'coords' && 'Moviendo el mouse se ve la posición X/Y'}
        </div>
      )}

      {measurements.length > 0 && (
        <div className="absolute bottom-6 left-6 flex max-h-[40%] max-w-[220px] flex-col gap-1 overflow-y-auto rounded-xl bg-[#101012]/90 p-2 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Mediciones</span>
            <button onClick={() => setMeasurements([])} className="text-neutral-500 hover:text-white" title="Borrar todas">
              <Trash2 size={12} />
            </button>
          </div>
          {measurements.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-neutral-200">
              <span className="truncate">
                {m.kind === 'distance' && fmtMm(m.value)}
                {m.kind === 'radius' && `R${m.radius.toFixed(1)} · ⌀${(m.radius * 2).toFixed(1)}`}
                {m.kind === 'angle' && `${m.degrees.toFixed(1)}°`}
                {m.kind === 'area' && `${(m.area / 1_000_000).toFixed(4)}m²`}
              </span>
              <button onClick={() => removeMeasurement(m.id)} className="shrink-0 text-neutral-500 hover:text-white">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
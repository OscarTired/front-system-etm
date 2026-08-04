'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Target,
  Grid,
  Ruler,
  CircleDot,
  Triangle,
  Square,
  Crosshair,
  X,
  Trash2,
  Magnet,
  AlertTriangle,
  Play,
  Pause,
  SkipBack,
  ChevronsRight,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}
interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

type Entity =
  | { kind: 'line'; a: Point; b: Point; color: string; pieceIndex?: number; layer?: string }
  | { kind: 'polyline'; points: Point[]; closed: boolean; color: string; pieceIndex?: number; layer?: string }
  | { kind: 'circle'; center: Point; radius: number; color: string; pieceIndex?: number; layer?: string }
  | {
      kind: 'arc';
      center: Point;
      radius: number;
      startAngle: number;
      endAngle: number;
      color: string;
      pieceIndex?: number;
      layer?: string;
    }
  | { kind: 'text'; position: Point; text: string; height: number; color: string; pieceIndex?: number; layer?: string };

function computeBounds(entities: Entity[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const expand = (p: Point) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  };

  for (const e of entities) {
    if (e.kind === 'line') {
      expand(e.a);
      expand(e.b);
    } else if (e.kind === 'polyline') e.points.forEach(expand);
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

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersects =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

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
  subOutlines: { points: Point[]; color?: string; layer?: string }[];
  outline?: Point[];
  angle?: number;
}

export interface LayerInfo {
  key: string;
  label: string;
  color: string;
  count: number;
}

export function computeLayerList(pieces: NestingPieceInput[]): LayerInfo[] {
  const map = new Map<string, LayerInfo>();
  for (const piece of pieces) {
    for (const sub of piece.subOutlines) {
      const color = sub.color ?? '#22c55e';
      const key = sub.layer ?? color;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { key, label: sub.layer ?? color, color, count: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

interface DxfCanvasProps {
  pieces: NestingPieceInput[];
  sheetSize?: { width: number; height: number };
  selectedPieceIndices?: number[];
  onSelectPiece?: (index: number | null, additive: boolean) => void;
  hiddenKeys?: string[];
  collidingPieceIndices?: number[];
  onMovePieces?: (pieceIndices: number[], dx: number, dy: number) => void;
  onRotateSelected?: (pieceIndices: number[], degrees: number) => void;
}

const SHEET_STROKE = '#71717a';
const SELECTED_STROKE = '#ffffff';
const SELECTED_HALO = '#facc15';
const COLLISION_COLOR = '#ef4444';
const MEASURE_COLOR = '#22d3ee';
const MEASURE_PENDING_COLOR = '#67e8f9';

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

const HIT_TOLERANCE_PX = 10;
const SNAP_TOLERANCE_PX = 12;

interface SnapCandidate {
  point: Point;
  type: 'endpoint' | 'midpoint' | 'center';
}

interface ToolpathSeg {
  points: Point[];
  startLen: number;
  endLen: number;
}

function angleOfVector(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function fmtMm(v: number): string {
  return `${v.toFixed(1)}mm`;
}

export const DxfCanvas = ({
  pieces,
  sheetSize,
  selectedPieceIndices = [],
  onSelectPiece,
  hiddenKeys,
  collidingPieceIndices = [],
  onMovePieces,
}: DxfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const toolpathRef = useRef<ToolpathSeg[]>([]);
  const totalPathLengthRef = useRef(0);
  /** Path2D cacheado del recorrido completo — evita re-emitir miles de lineTo en cada frame cuando la sim ya terminó o está al 100%. */
  const fullPath2DRef = useRef<Path2D | null>(null);
  const viewRef = useRef<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const draggingRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  } | null>(null);
  const pieceDragRef = useRef<{ pieceIndices: number[]; startLocal: Point; offset: Point } | null>(null);

  const drawRafRef = useRef<number | null>(null);
  const simRafRef = useRef<number | null>(null);
  const simLastTsRef = useRef<number | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState<MeasureTool>('none');
  const [pendingPoints, setPendingPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [hoverLocal, setHoverLocal] = useState<Point | null>(null);
  const [hoverScreen, setHoverScreen] = useState<Point | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapCandidate, setSnapCandidate] = useState<SnapCandidate | null>(null);

  const [hasToolpath, setHasToolpath] = useState(false);
  const [simPanelOpen, setSimPanelOpen] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);

  const simProgressRef = useRef(0);
  const simRunningRef = useRef(false);
  useEffect(() => {
    simProgressRef.current = simProgress;
  }, [simProgress]);
  useEffect(() => {
    simRunningRef.current = simRunning;
  }, [simRunning]);

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

  /**
   * Dibuja solo el tramo de toolpath hasta `targetLen`.
   * Si el recorrido está completo, usa Path2D cacheado (1 stroke).
   */
  const strokeToolpathUntil = useCallback(
    (ctx: CanvasRenderingContext2D, targetLen: number, scale: number) => {
      const total = totalPathLengthRef.current;
      if (total <= 0 || targetLen <= 0) return null as Point | null;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2 / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Recorrido completo → un solo Path2D (mucho más barato con miles de segmentos)
      if (targetLen >= total - 1e-6 && fullPath2DRef.current) {
        ctx.stroke(fullPath2DRef.current);
        const lastSeg = toolpathRef.current[toolpathRef.current.length - 1];
        return lastSeg?.points[lastSeg.points.length - 1] ?? null;
      }

      let headPoint: Point | null = null;
      for (const seg of toolpathRef.current) {
        if (seg.startLen >= targetLen) break;

        if (seg.endLen <= targetLen) {
          ctx.beginPath();
          seg.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.stroke();
          headPoint = seg.points[seg.points.length - 1];
        } else {
          let acc = seg.startLen;
          ctx.beginPath();
          ctx.moveTo(seg.points[0].x, seg.points[0].y);
          for (let i = 0; i < seg.points.length - 1; i++) {
            const p1 = seg.points[i];
            const p2 = seg.points[i + 1];
            const partLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (acc + partLen >= targetLen) {
              const t = partLen > 0 ? (targetLen - acc) / partLen : 0;
              headPoint = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
              ctx.lineTo(headPoint.x, headPoint.y);
              break;
            }
            ctx.lineTo(p2.x, p2.y);
            acc += partLen;
          }
          ctx.stroke();
        }
      }
      return headPoint;
    },
    []
  );

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

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
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

    const progress = simProgressRef.current;
    const simActive = progress > 0.001;
    const selectedSet = new Set(selectedPieceIndices);
    const collidingSet = new Set(collidingPieceIndices);

    // Geometría base (atenuada solo mientras la simulación está en curso, no al 100% idle)
    const attenuate = simActive && progress < 0.999;
    ctx.globalAlpha = attenuate ? 0.28 : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const e of entitiesRef.current) {
      const isSelected = e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex);
      const isColliding = e.pieceIndex !== undefined && collidingSet.has(e.pieceIndex);
      ctx.strokeStyle = isColliding ? COLLISION_COLOR : isSelected ? SELECTED_STROKE : e.color;
      ctx.fillStyle = e.color;
      ctx.lineWidth = (isColliding || isSelected ? 1.8 : 1) / scale;
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
    ctx.globalAlpha = 1;

    // Overlay de corte solo si hay progreso (y no es un 100% “fantasma” sin panel activo)
    if (simActive) {
      const targetLen = progress * totalPathLengthRef.current;
      const headPoint = strokeToolpathUntil(ctx, targetLen, scale);

      if (headPoint && progress < 0.999) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 9 / scale, 0, Math.PI * 2);
        ctx.stroke();
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

    for (const idx of collidingPieceIndices) {
      const collidingEntities = entitiesRef.current.filter((e) => e.pieceIndex === idx);
      const bounds = computeBounds(collidingEntities);
      if (bounds) {
        const pad = 4 / scale;
        ctx.strokeStyle = COLLISION_COLOR;
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(
          bounds.minX - pad,
          bounds.minY - pad,
          bounds.maxX - bounds.minX + pad * 2,
          bounds.maxY - bounds.minY + pad * 2
        );
      }
    }

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

      const last = pendingPoints[pendingPoints.length - 1];
      if (hoverLocal) {
        const guideTol = 2 / scale;
        ctx.strokeStyle = MEASURE_COLOR;
        ctx.lineWidth = 0.75 / scale;
        ctx.setLineDash([2 / scale, 3 / scale]);
        if (Math.abs(hoverLocal.x - last.x) < guideTol) {
          ctx.beginPath();
          ctx.moveTo(last.x, last.y - 5000);
          ctx.lineTo(last.x, last.y + 5000);
          ctx.stroke();
        }
        if (Math.abs(hoverLocal.y - last.y) < guideTol) {
          ctx.beginPath();
          ctx.moveTo(last.x - 5000, last.y);
          ctx.lineTo(last.x + 5000, last.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    if (snapCandidate) {
      const s = 5 / scale;
      const p = snapCandidate.point;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5 / scale;
      ctx.beginPath();
      if (snapCandidate.type === 'endpoint') {
        ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
      } else if (snapCandidate.type === 'midpoint') {
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s, p.y);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

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
          labelLocal = {
            x: m.vertex.x + Math.cos(midAngle) * 24,
            y: m.vertex.y + Math.sin(midAngle) * 24,
          };
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
  }, [
    sheetSize,
    selectedPieceIndices,
    collidingPieceIndices,
    measurements,
    pendingPoints,
    hoverLocal,
    hoverScreen,
    activeTool,
    localToScreen,
    snapCandidate,
    strokeToolpathUntil,
  ]);

  /** Agrupa varios draw() del mismo frame (pan a 60–120 Hz) en un solo rAF. */
  const scheduleDraw = useCallback(() => {
    if (drawRafRef.current !== null) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      draw();
    });
  }, [draw]);

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
    scheduleDraw();
  }, [scheduleDraw, sheetSize]);

  const focusOnSelectedPiece = useCallback(() => {
    if (selectedPieceIndices.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    const selectedSet = new Set(selectedPieceIndices);
    const selectedEntities = entitiesRef.current.filter(
      (e) => e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex)
    );
    const bounds = computeBounds(selectedEntities);
    if (!bounds) return;

    const drawW = bounds.maxX - bounds.minX || 1;
    const drawH = bounds.maxY - bounds.minY || 1;
    const padding = 0.6;

    const scale = Math.min((w / drawW) * padding, (h / drawH) * padding);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    viewRef.current = {
      scale,
      offsetX: -centerX * scale,
      offsetY: -centerY * scale,
    };
    scheduleDraw();
  }, [scheduleDraw, selectedPieceIndices]);

  /** Al interactuar con la vista, limpia el overlay de sim terminada para no pintar el path completo en cada frame de pan. */
  const clearSimOverlayIfIdle = useCallback(() => {
    if (!simRunningRef.current && simProgressRef.current > 0) {
      setSimProgress(0);
      simProgressRef.current = 0;
    }
  }, []);

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
            out.push({
              kind: 'polyline',
              points: sub.points,
              closed: false,
              color,
              pieceIndex,
              layer: sub.layer,
            });
          }
        }
      } else if (piece.outline && piece.outline.length >= 2) {
        out.push({
          kind: 'polyline',
          points: piece.outline,
          closed: true,
          color: '#22c55e',
          pieceIndex,
        });
      }
    });
    entitiesRef.current = out;

    const ARC_SEGMENTS = 24;
    const path: ToolpathSeg[] = [];
    const path2d = new Path2D();
    let cumLen = 0;

    for (const e of out) {
      let pts: Point[] | null = null;
      if (e.kind === 'line') pts = [e.a, e.b];
      else if (e.kind === 'polyline') pts = e.closed ? [...e.points, e.points[0]] : e.points;
      else if (e.kind === 'circle') {
        pts = Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
          const a = (i / ARC_SEGMENTS) * Math.PI * 2;
          return {
            x: e.center.x + Math.cos(a) * e.radius,
            y: e.center.y + Math.sin(a) * e.radius,
          };
        });
      } else if (e.kind === 'arc') {
        pts = Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
          const a = e.startAngle + (i / ARC_SEGMENTS) * (e.endAngle - e.startAngle);
          return {
            x: e.center.x + Math.cos(a) * e.radius,
            y: e.center.y + Math.sin(a) * e.radius,
          };
        });
      }
      if (!pts || pts.length < 2) continue;

      let segLen = 0;
      path2d.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        path2d.lineTo(pts[i + 1].x, pts[i + 1].y);
        segLen += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      }
      path.push({ points: pts, startLen: cumLen, endLen: cumLen + segLen });
      cumLen += segLen;
    }

    toolpathRef.current = path;
    totalPathLengthRef.current = cumLen;
    fullPath2DRef.current = cumLen > 0 ? path2d : null;
    setHasToolpath(cumLen > 0);
    setSimProgress(0);
    simProgressRef.current = 0;
    setSimRunning(false);
    simRunningRef.current = false;
    requestAnimationFrame(fitToView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, sheetSize?.width, sheetSize?.height, hiddenKeys]);

  useEffect(() => {
    scheduleDraw();
  }, [scheduleDraw, simProgress]);

  useEffect(() => {
    if (!simRunning) {
      simLastTsRef.current = null;
      if (simRafRef.current !== null) cancelAnimationFrame(simRafRef.current);
      return;
    }

    const BASE_MM_PER_SEC = 80;

    const tick = (ts: number) => {
      if (simLastTsRef.current === null) simLastTsRef.current = ts;
      const deltaSec = Math.min(0.05, (ts - simLastTsRef.current) / 1000);
      simLastTsRef.current = ts;

      const totalLen = totalPathLengthRef.current || 1;
      const deltaProgress = (BASE_MM_PER_SEC * simSpeed * deltaSec) / totalLen;

      setSimProgress((prev) => {
        const next = prev + deltaProgress;
        if (next >= 1) {
          setSimRunning(false);
          simRunningRef.current = false;
          return 1;
        }
        return next;
      });

      simRafRef.current = requestAnimationFrame(tick);
    };

    simRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (simRafRef.current !== null) cancelAnimationFrame(simRafRef.current);
    };
  }, [simRunning, simSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => scheduleDraw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [scheduleDraw]);

  const screenToLocal = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { scale, offsetX, offsetY } = viewRef.current;
    const cx = clientX - rect.left - rect.width / 2 - offsetX;
    const cy = clientY - rect.top - rect.height / 2 - offsetY;
    return { x: cx / scale, y: cy / scale };
  }, []);

  const computeSnapCandidates = useCallback((): SnapCandidate[] => {
    const out: SnapCandidate[] = [];
    for (const e of entitiesRef.current) {
      if (e.kind === 'line') {
        out.push({ point: e.a, type: 'endpoint' });
        out.push({ point: e.b, type: 'endpoint' });
        out.push({
          point: { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 },
          type: 'midpoint',
        });
      } else if (e.kind === 'polyline') {
        for (let i = 0; i < e.points.length; i++) {
          out.push({ point: e.points[i], type: 'endpoint' });
          const next = e.points[i + 1] ?? (e.closed ? e.points[0] : null);
          if (next) {
            out.push({
              point: { x: (e.points[i].x + next.x) / 2, y: (e.points[i].y + next.y) / 2 },
              type: 'midpoint',
            });
          }
        }
      } else if (e.kind === 'circle' || e.kind === 'arc') {
        out.push({ point: e.center, type: 'center' });
      }
    }
    return out;
  }, []);

  const findNearestSnap = useCallback(
    (point: Point): SnapCandidate | null => {
      const tol = SNAP_TOLERANCE_PX / viewRef.current.scale;
      let best: SnapCandidate | null = null;
      let bestDist = tol;
      for (const c of computeSnapCandidates()) {
        const d = Math.hypot(point.x - c.point.x, point.y - c.point.y);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      return best;
    },
    [computeSnapCandidates]
  );

  const hitTestCircleOrArc = useCallback((point: Point): { center: Point; radius: number } | null => {
    const tol = HIT_TOLERANCE_PX / viewRef.current.scale;
    for (const e of entitiesRef.current) {
      if (e.kind !== 'circle' && e.kind !== 'arc') continue;
      const dist = Math.hypot(point.x - e.center.x, point.y - e.center.y);
      if (Math.abs(dist - e.radius) <= tol) return { center: e.center, radius: e.radius };
    }
    return null;
  }, []);

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

  const handleToolClick = useCallback(
    (point: Point) => {
      if (activeTool === 'distance') {
        const next = [...pendingPoints, point];
        if (next.length < 2) {
          setPendingPoints(next);
          return;
        }
        const [a, b] = next;
        setMeasurements((prev) => [
          ...prev,
          {
            id: `d-${Date.now()}`,
            kind: 'distance',
            a,
            b,
            value: Math.hypot(b.x - a.x, b.y - a.y),
          },
        ]);
        setPendingPoints([]);
      } else if (activeTool === 'radius') {
        const hit = hitTestCircleOrArc(point);
        if (!hit) return;
        setMeasurements((prev) => [
          ...prev,
          {
            id: `r-${Date.now()}`,
            kind: 'radius',
            center: hit.center,
            radius: hit.radius,
            anglePoint: point,
          },
        ]);
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
        setMeasurements((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            kind: 'angle',
            vertex,
            p1,
            p2,
            degrees,
          },
        ]);
        setPendingPoints([]);
      } else if (activeTool === 'area') {
        const contour = hitTestClosedContour(point);
        if (!contour) return;
        const area = polygonArea(contour);
        const perimeter = polygonPerimeter(contour);
        const centroid = contour.reduce(
          (acc, p) => ({ x: acc.x + p.x / contour.length, y: acc.y + p.y / contour.length }),
          { x: 0, y: 0 }
        );
        setMeasurements((prev) => [
          ...prev,
          {
            id: `ar-${Date.now()}`,
            kind: 'area',
            points: contour,
            area,
            perimeter,
            centroid,
          },
        ]);
      }
    },
    [activeTool, pendingPoints, hitTestCircleOrArc, hitTestClosedContour]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      const rawPoint = screenToLocal(e.clientX, e.clientY);

      if (activeTool === 'none' && rawPoint && selectedPieceIndices.length > 0) {
        const selectedSet = new Set(selectedPieceIndices);
        let hitSelected = false;
        for (const ent of entitiesRef.current) {
          if (
            ent.kind === 'polyline' &&
            ent.pieceIndex !== undefined &&
            selectedSet.has(ent.pieceIndex) &&
            ent.points.length >= 3
          ) {
            if (pointInPolygon(rawPoint, ent.points)) hitSelected = true;
          }
        }
        if (hitSelected) {
          pieceDragRef.current = {
            pieceIndices: [...selectedPieceIndices],
            startLocal: rawPoint,
            offset: { x: 0, y: 0 },
          };
          canvas.setPointerCapture(e.pointerId);
          canvas.style.cursor = 'grabbing';
          return;
        }
      }

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
        const rawPoint = screenToLocal(e.clientX, e.clientY);
        const rect = canvas.getBoundingClientRect();
        const usesPointSnap = activeTool === 'distance' || activeTool === 'angle' || activeTool === 'coords';
        const snap = snapEnabled && usesPointSnap && rawPoint ? findNearestSnap(rawPoint) : null;
        setSnapCandidate(snap);
        setHoverLocal(snap ? snap.point : rawPoint);
        setHoverScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }

      const pieceDrag = pieceDragRef.current;
      if (pieceDrag) {
        const rawPoint = screenToLocal(e.clientX, e.clientY);
        if (rawPoint) {
          pieceDrag.offset = {
            x: rawPoint.x - pieceDrag.startLocal.x,
            y: rawPoint.y - pieceDrag.startLocal.y,
          };
          scheduleDraw();
        }
        return;
      }

      if (activeTool === 'none' && !draggingRef.current) {
        const rawPoint = screenToLocal(e.clientX, e.clientY);
        let overSelected = false;
        if (rawPoint && selectedPieceIndices.length > 0) {
          const selectedSet = new Set(selectedPieceIndices);
          for (const ent of entitiesRef.current) {
            if (
              ent.kind === 'polyline' &&
              ent.pieceIndex !== undefined &&
              selectedSet.has(ent.pieceIndex) &&
              ent.points.length >= 3
            ) {
              if (pointInPolygon(rawPoint, ent.points)) overSelected = true;
            }
          }
        }
        canvas.style.cursor = overSelected ? 'move' : 'grab';
      }

      const drag = draggingRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!drag.moved) {
          drag.moved = true;
          // Al empezar a panear, quita overlay de sim terminada → pan fluido
          clearSimOverlayIfIdle();
        }
      }
      viewRef.current = {
        ...viewRef.current,
        offsetX: drag.startOffsetX + dx,
        offsetY: drag.startOffsetY + dy,
      };
      scheduleDraw();
    };

    const onPointerUp = (e: PointerEvent) => {
      const pieceDrag = pieceDragRef.current;
      pieceDragRef.current = null;
      if (pieceDrag) {
        canvas.style.cursor = 'move';
        if (Math.abs(pieceDrag.offset.x) > 0.01 || Math.abs(pieceDrag.offset.y) > 0.01) {
          onMovePieces?.(pieceDrag.pieceIndices, pieceDrag.offset.x, pieceDrag.offset.y);
        }
        scheduleDraw();
        return;
      }

      const drag = draggingRef.current;
      draggingRef.current = null;
      if (!drag) return;

      if (!drag.moved) {
        const rawPoint = screenToLocal(e.clientX, e.clientY);
        if (!rawPoint) return;

        if (activeTool !== 'none' && activeTool !== 'coords') {
          const usesPointSnap = activeTool === 'distance' || activeTool === 'angle';
          const snap = snapEnabled && usesPointSnap ? findNearestSnap(rawPoint) : null;
          handleToolClick(snap ? snap.point : rawPoint);
          return;
        }

        if (activeTool === 'none' && onSelectPiece) {
          let hit: number | null = null;
          for (const ent of entitiesRef.current) {
            if (ent.kind === 'polyline' && ent.pieceIndex !== undefined && ent.points.length >= 3) {
              if (pointInPolygon(rawPoint, ent.points)) hit = ent.pieceIndex;
            }
          }
          onSelectPiece(hit, e.shiftKey || e.ctrlKey || e.metaKey);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearSimOverlayIfIdle();
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
      scheduleDraw();
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
  }, [
    scheduleDraw,
    onSelectPiece,
    screenToLocal,
    activeTool,
    handleToolClick,
    snapEnabled,
    findNearestSnap,
    selectedPieceIndices,
    onMovePieces,
    clearSimOverlayIfIdle,
  ]);

  const handleZoom = useCallback(
    (direction: 'in' | 'out') => {
      clearSimOverlayIfIdle();
      const factor = direction === 'in' ? 1.25 : 0.8;
      viewRef.current = { ...viewRef.current, scale: viewRef.current.scale * factor };
      scheduleDraw();
    },
    [scheduleDraw, clearSimOverlayIfIdle]
  );

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeSimPanel = useCallback(() => {
    setSimRunning(false);
    simRunningRef.current = false;
    setSimProgress(0);
    simProgressRef.current = 0;
    setSimPanelOpen(false);
  }, []);

  const openSimPanel = useCallback(() => {
    setSimPanelOpen(true);
  }, []);

  const mdBtn =
    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors duration-150 hover:bg-white/10 hover:text-white active:bg-white/15 disabled:pointer-events-none disabled:opacity-30';
  const mdBtnActive = 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/25 hover:text-blue-300';
  const mdDivider = 'mx-0.5 h-5 w-px shrink-0 bg-white/10';

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: '#0a0a0c',
        backgroundImage: showGrid
          ? 'radial-gradient(circle, #3a3a3f 1.5px, transparent 1.5px)'
          : 'none',
        backgroundSize: '24px 24px',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" />

      {/* Toolbar unificada superior — Material Design, sin borde */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-3 px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-[#1c1c1e]/92 px-1.5 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Vista */}
          <button type="button" onClick={() => handleZoom('in')} className={mdBtn} title="Acercar">
            <ZoomIn size={16} strokeWidth={1.75} />
          </button>
          <button type="button" onClick={() => handleZoom('out')} className={mdBtn} title="Alejar">
            <ZoomOut size={16} strokeWidth={1.75} />
          </button>
          <button type="button" onClick={fitToView} className={mdBtn} title="Ajustar a la vista">
            <Maximize size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={focusOnSelectedPiece}
            disabled={selectedPieceIndices.length === 0}
            className={mdBtn}
            title="Centrar en selección"
          >
            <Target size={16} strokeWidth={1.75} />
          </button>

          <div className={mdDivider} />

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`${mdBtn} ${showGrid ? mdBtnActive : ''}`}
            title="Cuadrícula"
          >
            <Grid size={16} strokeWidth={1.75} />
          </button>

          <div className={mdDivider} />

          {/* Metrología */}
          {(
            [
              ['distance', Ruler, TOOL_LABELS.distance],
              ['radius', CircleDot, TOOL_LABELS.radius],
              ['angle', Triangle, TOOL_LABELS.angle],
              ['area', Square, TOOL_LABELS.area],
              ['coords', Crosshair, TOOL_LABELS.coords],
            ] as const
          ).map(([tool, Icon, label]) => (
            <button
              key={tool}
              type="button"
              onClick={() => {
                if (activeTool === tool) {
                  resetTool();
                } else {
                  setActiveTool(tool);
                  setPendingPoints([]);
                }
              }}
              className={`${mdBtn} ${
                activeTool === tool
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/25 hover:text-cyan-300'
                  : ''
              }`}
              title={label}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSnapEnabled((v) => !v)}
            className={`${mdBtn} ${
              snapEnabled
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/25 hover:text-amber-300'
                : ''
            }`}
            title={snapEnabled ? 'Snap activado' : 'Snap desactivado'}
          >
            <Magnet size={16} strokeWidth={1.75} />
          </button>

          {activeTool !== 'none' && (
            <button type="button" onClick={resetTool} className={mdBtn} title="Salir de herramienta">
              <X size={16} strokeWidth={1.75} />
            </button>
          )}

          {/* Simulación: colapsada = icono; expandida = controles + X, con transición */}
          {hasToolpath && (
            <>
              <div className={mdDivider} />

              {!simPanelOpen ? (
                <button
                  type="button"
                  onClick={openSimPanel}
                  className={mdBtn}
                  title="Simulación de corte"
                >
                  <ChevronsRight size={16} strokeWidth={1.75} />
                </button>
              ) : (
                <div
                  className="flex items-center gap-0.5 overflow-hidden transition-[max-width,opacity] duration-300 ease-out"
                  style={{ maxWidth: 280, opacity: 1 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (simProgress >= 1) {
                        setSimProgress(0);
                        simProgressRef.current = 0;
                      }
                      setSimRunning((v) => !v);
                    }}
                    className={mdBtn}
                    title={simRunning ? 'Pausar' : 'Reproducir'}
                  >
                    {simRunning ? (
                      <Pause size={15} strokeWidth={1.75} />
                    ) : (
                      <Play size={15} strokeWidth={1.75} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimRunning(false);
                      simRunningRef.current = false;
                      setSimProgress(0);
                      simProgressRef.current = 0;
                    }}
                    disabled={simProgress === 0 && !simRunning}
                    className={mdBtn}
                    title="Reiniciar"
                  >
                    <SkipBack size={14} strokeWidth={1.75} />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.001}
                    value={simProgress}
                    onChange={(e) => {
                      setSimRunning(false);
                      simRunningRef.current = false;
                      const v = Number(e.target.value);
                      setSimProgress(v);
                      simProgressRef.current = v;
                    }}
                    className="mx-1 h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    title="Progreso de corte"
                  />

                  <select
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    className="h-7 rounded-full border-0 bg-transparent px-1.5 text-[11px] text-neutral-300 outline-none hover:bg-white/5 focus:bg-white/5"
                  >
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                    <option value={4}>4×</option>
                  </select>

                  <button
                    type="button"
                    onClick={closeSimPanel}
                    className={mdBtn}
                    title="Cerrar simulación"
                  >
                    <X size={16} strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hint herramienta */}
      {activeTool !== 'none' && (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-[#1c1c1e]/90 px-3 py-1.5 text-[11px] text-neutral-400 shadow-md backdrop-blur-md transition-opacity duration-200">
          {activeTool === 'distance' &&
            (pendingPoints.length === 0 ? 'Clic en el primer punto' : 'Clic en el segundo punto')}
          {activeTool === 'radius' && 'Clic sobre un círculo o arco'}
          {activeTool === 'angle' &&
            (pendingPoints.length === 0
              ? 'Clic en el vértice'
              : pendingPoints.length === 1
                ? 'Clic en el primer punto'
                : 'Clic en el segundo punto')}
          {activeTool === 'area' && 'Clic dentro de un contorno cerrado'}
          {activeTool === 'coords' && 'Mueve el mouse para ver X / Y'}
        </div>
      )}

      {collidingPieceIndices.length > 0 && (
        <div className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 shadow-md backdrop-blur-md">
          <AlertTriangle className="h-3.5 w-3.5" />
          {collidingPieceIndices.length === 1
            ? '1 pieza se solapa con otra'
            : `${collidingPieceIndices.length} piezas se solapan`}
        </div>
      )}

      {measurements.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 flex max-h-[40%] max-w-55 flex-col gap-1 overflow-y-auto rounded-2xl bg-[#1c1c1e]/92 p-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="flex items-center justify-between px-1.5 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Mediciones
            </span>
            <button
              type="button"
              onClick={() => setMeasurements([])}
              className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
              title="Borrar todas"
            >
              <Trash2 size={12} />
            </button>
          </div>
          {measurements.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[11px] text-neutral-200"
            >
              <span className="truncate">
                {m.kind === 'distance' && fmtMm(m.value)}
                {m.kind === 'radius' && `R${m.radius.toFixed(1)} · ⌀${(m.radius * 2).toFixed(1)}`}
                {m.kind === 'angle' && `${m.degrees.toFixed(1)}°`}
                {m.kind === 'area' && `${(m.area / 1_000_000).toFixed(4)}m²`}
              </span>
              <button
                type="button"
                onClick={() => removeMeasurement(m.id)}
                className="shrink-0 rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
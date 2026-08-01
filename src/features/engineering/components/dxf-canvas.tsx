'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DxfParser from 'dxf-parser';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

interface Point { x: number; y: number }
interface ViewState { scale: number; offsetX: number; offsetY: number }

// Tabla de colores estándar AutoCAD Color Index (ACI), los más usados
// en DXFs reales. No es la tabla completa de 256 colores, pero cubre
// los índices que casi siempre se usan en dibujos técnicos.
const ACI_COLORS: Record<number, string> = {
  1: '#ff0000', // rojo
  2: '#ffff00', // amarillo
  3: '#00ff00', // verde
  4: '#00ffff', // cian
  5: '#0000ff', // azul
  6: '#ff00ff', // magenta
  7: '#ffffff', // blanco/negro (aquí se trata como blanco por el fondo oscuro)
  8: '#808080', // gris
  9: '#c0c0c0', // gris claro
};

function resolveColor(entity: any, layers: Record<string, any>): string {
  if (typeof entity.colorIndex === 'number' && entity.colorIndex > 0 && entity.colorIndex !== 256) {
    return ACI_COLORS[entity.colorIndex] || '#4ade80';
  }
  const layer = layers?.[entity.layer];
  if (layer && typeof layer.colorIndex === 'number' && layer.colorIndex > 0) {
    return ACI_COLORS[layer.colorIndex] || '#4ade80';
  }
  return '#4ade80';
}

// Entidad de dibujo interna del canvas. `pieceIndex` es NUEVO (v2):
// agrupa entidades por pieza para poder hacer hit-test/selección —
// ausente (undefined) cuando el canvas se usa en modo "archivo DXF
// suelto" (el uso original de /engineering), presente cuando se usa
// en modo "piezas nesteadas" (el uso nuevo de /nesting).
type Entity =
  | { kind: 'line'; a: Point; b: Point; color: string; pieceIndex?: number }
  | { kind: 'polyline'; points: Point[]; closed: boolean; color: string; pieceIndex?: number }
  | { kind: 'circle'; center: Point; radius: number; color: string; pieceIndex?: number }
  | { kind: 'arc'; center: Point; radius: number; startAngle: number; endAngle: number; color: string; pieceIndex?: number }
  | { kind: 'text'; position: Point; text: string; height: number; color: string; pieceIndex?: number };

function extractEntitiesFromDxf(dxf: any): Entity[] {
  const out: Entity[] = [];
  const rawEntities = dxf?.entities ?? [];
  const layers = dxf?.tables?.layer?.layers ?? {};

  for (const e of rawEntities) {
    const color = resolveColor(e, layers);

    switch (e.type) {
      case 'LINE':
        if (e.vertices?.length >= 2) {
          out.push({ kind: 'line', a: e.vertices[0], b: e.vertices[1], color });
        }
        break;
      case 'LWPOLYLINE':
      case 'POLYLINE':
        if (e.vertices?.length >= 2) {
          out.push({
            kind: 'polyline',
            points: e.vertices.map((v: any) => ({ x: v.x, y: v.y })),
            closed: !!e.shape || !!e.closed,
            color,
          });
        }
        break;
      case 'CIRCLE':
        out.push({ kind: 'circle', center: e.center, radius: e.radius, color });
        break;
      case 'ARC':
        // dxf-parser ya entrega startAngle/endAngle en RADIANES.
        out.push({ kind: 'arc', center: e.center, radius: e.radius, startAngle: e.startAngle, endAngle: e.endAngle, color });
        break;
      case 'TEXT':
      case 'MTEXT':
        if (e.text && e.startPoint) {
          out.push({ kind: 'text', position: e.startPoint, text: e.text, height: e.textHeight || e.height || 2.5, color });
        }
        break;
    }
  }
  return out;
}

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

export interface NestingPieceInput {
  /** Puntos del contorno de cada sub-trazo de la pieza, con su color real. */
  subOutlines: { points: Point[]; color?: string }[];
  /** Contorno fusionado, usado solo como respaldo para hit-test si no hay subOutlines. */
  outline?: Point[];
  angle?: number;
}

interface DxfCanvasProps {
  /** Modo "archivo DXF suelto" (uso original de /engineering): fetchea y parsea la URL. */
  url?: string;
  /** Modo "piezas nesteadas" (uso nuevo de /nesting): datos ya calculados, sin fetch ni parseo. */
  pieces?: NestingPieceInput[];
  /** Tamaño de la plancha — dibuja un rectángulo gris claro de fondo. Solo aplica en modo `pieces`. */
  sheetSize?: { width: number; height: number };
  /** Índice de la pieza seleccionada (modo `pieces`), para resaltarla. */
  selectedPieceIndex?: number | null;
  /** Se dispara al hacer click sobre una pieza (modo `pieces`) o en vacío (null). */
  onSelectPiece?: (index: number | null) => void;
}

const SHEET_STROKE = '#71717a';
const SELECTED_STROKE = '#ffffff';
const SELECTED_HALO = '#facc15';

export const DxfCanvas = ({ url, pieces, sheetSize, selectedPieceIndex = null, onSelectPiece }: DxfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const viewRef = useRef<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const draggingRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number; moved: boolean } | null>(null);

  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const isPieceMode = !!pieces;

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
    // Y invertido solo en modo archivo DXF suelto (convención AutoCAD,
    // Y hacia arriba). En modo pieza usamos el mismo sistema de
    // coordenadas interno del motor de nesting (Y hacia abajo), sin
    // invertir, para que coincida exactamente con lo exportado.
    ctx.scale(scale, isPieceMode ? scale : -scale);

    if (isPieceMode && sheetSize) {
      ctx.strokeStyle = SHEET_STROKE;
      ctx.lineWidth = 1 / scale;
      ctx.strokeRect(0, 0, sheetSize.width, sheetSize.height);
    }

    ctx.lineWidth = 1 / scale;

    for (const e of entitiesRef.current) {
      const isSelected = isPieceMode && e.pieceIndex === selectedPieceIndex;
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
        ctx.scale(1, isPieceMode ? 1 : -1);
        ctx.font = `${e.height}px sans-serif`;
        ctx.fillText(e.text, e.position.x, isPieceMode ? e.position.y : -e.position.y);
        ctx.restore();
      }
    }

    // Halo punteado de la pieza seleccionada.
    if (isPieceMode && selectedPieceIndex !== null) {
      const selectedEntities = entitiesRef.current.filter((e) => e.pieceIndex === selectedPieceIndex);
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

    ctx.restore();
  }, [isPieceMode, sheetSize, selectedPieceIndex]);

  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    // En modo pieza, encajamos a la PLANCHA completa (no solo a las
    // piezas) — así siempre se ve el marco de referencia entero.
    const bounds =
      isPieceMode && sheetSize
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
      offsetY: isPieceMode ? -centerY * scale : centerY * scale,
    };
    draw();
  }, [draw, isPieceMode, sheetSize]);

  // --- Modo "archivo DXF suelto": fetch + parse (comportamiento original, intacto) ---
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo descargar el archivo (${res.status})`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);
        entitiesRef.current = extractEntitiesFromDxf(dxf);
        setLoading(false);
        requestAnimationFrame(fitToView);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'Error al leer el archivo DXF');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url, fitToView]);

  // --- Modo "piezas nesteadas": datos directos, sin fetch ni parseo ---
  useEffect(() => {
    if (!pieces) return;
    const out: Entity[] = [];
    pieces.forEach((piece, pieceIndex) => {
      if (piece.subOutlines.length > 0) {
        for (const sub of piece.subOutlines) {
          if (sub.points.length >= 2) {
            out.push({ kind: 'polyline', points: sub.points, closed: false, color: sub.color ?? '#22c55e', pieceIndex });
          }
        }
      } else if (piece.outline && piece.outline.length >= 2) {
        out.push({ kind: 'polyline', points: piece.outline, closed: true, color: '#22c55e', pieceIndex });
      }
    });
    entitiesRef.current = out;
    requestAnimationFrame(fitToView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, sheetSize?.width, sheetSize?.height]);

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
    return { x: cx / scale, y: isPieceMode ? cy / scale : -cy / scale };
  }, [isPieceMode]);

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

      if (!drag.moved && isPieceMode && onSelectPiece) {
        const point = screenToLocal(e.clientX, e.clientY);
        if (point) {
          const byPiece = new Map<number, Point[]>();
          for (const ent of entitiesRef.current) {
            if (ent.kind !== 'polyline' || ent.pieceIndex === undefined) continue;
            if (!byPiece.has(ent.pieceIndex)) byPiece.set(ent.pieceIndex, []);
          }
          let hit: number | null = null;
          for (const ent of entitiesRef.current) {
            if (ent.kind === 'polyline' && ent.pieceIndex !== undefined && ent.points.length >= 3) {
              if (pointInPolygon(point, ent.points)) hit = ent.pieceIndex;
            }
          }
          onSelectPiece(hit);
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
  }, [draw, isPieceMode, onSelectPiece, screenToLocal]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.25 : 0.8;
    viewRef.current = { ...viewRef.current, scale: viewRef.current.scale * factor };
    draw();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{
        backgroundColor: '#0a0a0c',
        backgroundImage: 'radial-gradient(circle, #3a3a3f 1.5px, transparent 1.5px)',
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
        <button onClick={fitToView} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white" title="Centrar vista">
          <RotateCcw size={16} />
        </button>
      </div>

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/80 text-xs text-neutral-400">
          Cargando geometría...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/90 px-6 text-center text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};
import { angleOfVector, fmtMm, computeBounds } from "./geometry-utils"
import type {
  Entity,
  Measurement,
  Point,
  SnapCandidate,
  ToolpathSeg,
  ViewState,
} from "../types/types"
import {
  COLLISION_COLOR,
  MEASURE_COLOR,
  MEASURE_PENDING_COLOR,
  SELECTED_STROKE,
  SHEET_STROKE,
} from "../types/types"

export interface PieceDragPreview {
  indices: number[]
  dx: number
  dy: number
}

export interface DrawContext {
  ctx: CanvasRenderingContext2D
  view: ViewState
  canvasWidth: number
  canvasHeight: number
  entities: Entity[]
  sheetSize?: { width: number; height: number }
  selectedPieceIndices: number[]
  collidingPieceIndices: number[]
  simProgress: number
  toolpath: ToolpathSeg[]
  totalPathLength: number
  fullPath2D: Path2D | null
  measurements: Measurement[]
  pendingPoints: Point[]
  hoverLocal: Point | null
  hoverScreen: Point | null
  snapCandidate: SnapCandidate | null
  activeTool: string
  localToScreen: (p: Point) => Point
  /** Preview de arrastre: se aplica con ctx.translate, sin clonar entidades. */
  dragPreview?: PieceDragPreview | null
  snapGuides?: { axis: "x" | "y"; value: number }[]
  /** Rect de box-select en coords de pantalla del canvas (CSS px). */
  boxSelectScreen?: { x0: number; y0: number; x1: number; y1: number } | null
  /** Cuadrícula en coords mundo (se adapta al zoom). */
  gridStyle?: "dots" | "lines" | "cross" | "none"
  showGrid?: boolean
}

export function strokeToolpathUntil(
  ctx: CanvasRenderingContext2D,
  toolpath: ToolpathSeg[],
  totalPathLength: number,
  fullPath2D: Path2D | null,
  targetLen: number,
  scale: number
): Point | null {
  if (totalPathLength <= 0 || targetLen <= 0) return null

  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 2.2 / scale
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (targetLen >= totalPathLength - 1e-6 && fullPath2D) {
    ctx.stroke(fullPath2D)
    const lastSeg = toolpath[toolpath.length - 1]
    return lastSeg?.points[lastSeg.points.length - 1] ?? null
  }

  let headPoint: Point | null = null
  for (const seg of toolpath) {
    if (seg.startLen >= targetLen) break

    if (seg.endLen <= targetLen) {
      ctx.beginPath()
      seg.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
      headPoint = seg.points[seg.points.length - 1]
    } else {
      let acc = seg.startLen
      ctx.beginPath()
      ctx.moveTo(seg.points[0].x, seg.points[0].y)
      for (let i = 0; i < seg.points.length - 1; i++) {
        const p1 = seg.points[i]
        const p2 = seg.points[i + 1]
        const partLen = Math.hypot(p2.x - p1.x, p2.y - p1.y)
        if (acc + partLen >= targetLen) {
          const t = partLen > 0 ? (targetLen - acc) / partLen : 0
          headPoint = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }
          ctx.lineTo(headPoint.x, headPoint.y)
          break
        }
        ctx.lineTo(p2.x, p2.y)
        acc += partLen
      }
      ctx.stroke()
    }
  }
  return headPoint
}

function strokeEntity(ctx: CanvasRenderingContext2D, e: Entity, scale: number) {
  ctx.beginPath()
  if (e.kind === "line") {
    ctx.moveTo(e.a.x, e.a.y)
    ctx.lineTo(e.b.x, e.b.y)
    ctx.stroke()
  } else if (e.kind === "polyline") {
    e.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    if (e.closed) ctx.closePath()
    ctx.stroke()
  } else if (e.kind === "circle") {
    ctx.arc(e.center.x, e.center.y, e.radius, 0, Math.PI * 2)
    ctx.stroke()
  } else if (e.kind === "arc") {
    ctx.arc(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle)
    ctx.stroke()
  } else if (e.kind === "text") {
    ctx.save()
    ctx.font = `${e.height}px sans-serif`
    ctx.fillText(e.text, e.position.x, e.position.y)
    ctx.restore()
  }
}


/** Paso de cuadrícula en mm que se ve ~24–48 px en pantalla. */
function niceGridStep(scale: number): number {
  const targetPx = 32
  const raw = targetPx / Math.max(scale, 1e-9)
  const exp = Math.floor(Math.log10(raw))
  const base = Math.pow(10, exp)
  const frac = raw / base
  let mult = 1
  if (frac > 5) mult = 10
  else if (frac > 2) mult = 5
  else if (frac > 1) mult = 2
  return mult * base
}

/**
 * Dibuja la cuadrícula en coords locales del nesting (ya transformadas por el caller).
 * view: scale + offset en pantalla; w/h CSS del canvas.
 */
function drawWorldGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewState,
  canvasW: number,
  canvasH: number,
  scale: number,
  style: "dots" | "lines" | "cross",
) {
  const step = niceGridStep(scale)
  const majorEvery = 5
  const { offsetX, offsetY } = view

  // Esquina superior-izquierda del viewport en coords mundo
  // screen = center + offset + local * scale  =>  local = (screen - center - offset) / scale
  const inv = 1 / scale
  const worldLeft = (-canvasW / 2 - offsetX) * inv
  const worldTop = (-canvasH / 2 - offsetY) * inv
  const worldRight = (canvasW / 2 - offsetX) * inv
  const worldBottom = (canvasH / 2 - offsetY) * inv

  const x0 = Math.floor(worldLeft / step) * step
  const y0 = Math.floor(worldTop / step) * step

  ctx.save()
  ctx.lineCap = "butt"

  if (style === "lines" || style === "cross") {
    for (let x = x0; x <= worldRight + step; x += step) {
      const major = Math.abs(Math.round(x / step)) % majorEvery === 0
      ctx.strokeStyle = major ? "#3a3a42" : "#252528"
      ctx.lineWidth = (major ? 1 : 0.6) / scale
      ctx.beginPath()
      ctx.moveTo(x, worldTop - step)
      ctx.lineTo(x, worldBottom + step)
      ctx.stroke()
    }
    for (let y = y0; y <= worldBottom + step; y += step) {
      const major = Math.abs(Math.round(y / step)) % majorEvery === 0
      ctx.strokeStyle = major ? "#3a3a42" : "#252528"
      ctx.lineWidth = (major ? 1 : 0.6) / scale
      ctx.beginPath()
      ctx.moveTo(worldLeft - step, y)
      ctx.lineTo(worldRight + step, y)
      ctx.stroke()
    }
  }

  if (style === "dots" || style === "cross") {
    const r = 1.2 / scale
    ctx.fillStyle = "#3a3a3f"
    ctx.beginPath()
    for (let x = x0; x <= worldRight + step; x += step) {
      for (let y = y0; y <= worldBottom + step; y += step) {
        ctx.moveTo(x + r, y)
        ctx.arc(x, y, r, 0, Math.PI * 2)
      }
    }
    ctx.fill()
  }

  ctx.restore()
}



/** Cota estilo AutoCAD: extensiones sólidas + línea de cota + flechas + ticks. */
function drawCadDistance(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  offset: number | undefined,
  scale: number,
) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const off = offset ?? 14 / scale
  const sign = off >= 0 ? 1 : -1
  const absOff = Math.abs(off)
  const gap = 1.2 / scale
  const extBeyond = 2.5 / scale

  // Puntos en la línea de cota
  const aD = { x: a.x + nx * off, y: a.y + ny * off }
  const bD = { x: b.x + nx * off, y: b.y + ny * off }
  // Extensiones: desde cerca del objeto hasta un poco más allá de la línea de cota
  const aStart = { x: a.x + nx * sign * gap, y: a.y + ny * sign * gap }
  const bStart = { x: b.x + nx * sign * gap, y: b.y + ny * sign * gap }
  const aEnd = { x: a.x + nx * (off + sign * extBeyond), y: a.y + ny * (off + sign * extBeyond) }
  const bEnd = { x: b.x + nx * (off + sign * extBeyond), y: b.y + ny * (off + sign * extBeyond) }

  ctx.save()
  ctx.strokeStyle = MEASURE_COLOR
  ctx.fillStyle = MEASURE_COLOR
  ctx.lineWidth = 1 / scale
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // Líneas de extensión (sólidas, estilo ACAD)
  ctx.beginPath()
  ctx.moveTo(aStart.x, aStart.y)
  ctx.lineTo(aEnd.x, aEnd.y)
  ctx.moveTo(bStart.x, bStart.y)
  ctx.lineTo(bEnd.x, bEnd.y)
  ctx.stroke()

  // Línea de cota
  ctx.beginPath()
  ctx.moveTo(aD.x, aD.y)
  ctx.lineTo(bD.x, bD.y)
  ctx.stroke()

  // Flechas rellenas (estilo AutoCAD)
  const arrowLen = 3.2 / scale
  const arrowW = 1.1 / scale
  const drawArrow = (px: number, py: number, dirX: number, dirY: number) => {
    const bx = px + dirX * arrowLen
    const by = py + dirY * arrowLen
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(bx + (-dirY) * arrowW, by + dirX * arrowW)
    ctx.lineTo(bx - (-dirY) * arrowW, by - dirX * arrowW)
    ctx.closePath()
    ctx.fill()
  }
  // Flecha en A apunta hacia B; en B hacia A
  drawArrow(aD.x, aD.y, ux, uy)
  drawArrow(bD.x, bD.y, -ux, -uy)

  // Puntos de definición (pequeños)
  for (const p of [a, b]) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.4 / scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Resalta arista bajo el cursor (naranja ACAD-like). */
function drawHoverEdge(
  ctx: CanvasRenderingContext2D,
  seg: { a: { x: number; y: number }; b: { x: number; y: number } },
  scale: number,
) {
  ctx.save()
  ctx.strokeStyle = "#f59e0b"
  ctx.lineWidth = 2.2 / scale
  ctx.lineCap = "round"
  ctx.globalAlpha = 0.95
  ctx.beginPath()
  ctx.moveTo(seg.a.x, seg.a.y)
  ctx.lineTo(seg.b.x, seg.b.y)
  ctx.stroke()
  ctx.restore()
}

/**
 * Marcador OSNAP estilo AutoCAD:
 * - endpoint: cuadrado
 * - midpoint: triángulo
 * - center: círculo
 * - nearest: reloj / aspa en círculo
 */
function drawOsnapMarker(
  ctx: CanvasRenderingContext2D,
  c: { point: { x: number; y: number }; type: string },
  scale: number,
) {
  const s = 5.5 / scale
  const p = c.point
  ctx.save()
  ctx.strokeStyle = "#facc15"
  ctx.fillStyle = "rgba(250, 204, 21, 0.15)"
  ctx.lineWidth = 1.6 / scale
  ctx.beginPath()
  if (c.type === "endpoint") {
    ctx.rect(p.x - s, p.y - s, s * 2, s * 2)
    ctx.fill()
    ctx.stroke()
  } else if (c.type === "midpoint") {
    ctx.moveTo(p.x, p.y - s * 1.2)
    ctx.lineTo(p.x + s, p.y + s * 0.7)
    ctx.lineTo(p.x - s, p.y + s * 0.7)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (c.type === "center") {
    ctx.arc(p.x, p.y, s, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p.x - s * 1.4, p.y)
    ctx.lineTo(p.x + s * 1.4, p.y)
    ctx.moveTo(p.x, p.y - s * 1.4)
    ctx.lineTo(p.x, p.y + s * 1.4)
    ctx.stroke()
  } else {
    // nearest — círculo + cruz (pickbox)
    ctx.arc(p.x, p.y, s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p.x - s * 0.7, p.y)
    ctx.lineTo(p.x + s * 0.7, p.y)
    ctx.moveTo(p.x, p.y - s * 0.7)
    ctx.lineTo(p.x, p.y + s * 0.7)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawScene(d: DrawContext) {
  const {
    ctx,
    view,
    canvasWidth: w,
    canvasHeight: h,
    entities,
    sheetSize,
    selectedPieceIndices,
    collidingPieceIndices,
    simProgress,
    toolpath,
    totalPathLength,
    fullPath2D,
    measurements,
    pendingPoints,
    hoverLocal,
    hoverScreen,
    snapCandidate,
    activeTool,
    localToScreen,
    dragPreview,
    snapGuides,
    gridStyle = "dots",
    showGrid = true,
  } = d

  const { scale, offsetX, offsetY, rotationDeg = 0 } = view
  const dpr = window.devicePixelRatio || 1

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w / 2 + offsetX, h / 2 + offsetY)
  if (rotationDeg === 90) {
    ctx.rotate(Math.PI / 2)
  }
  ctx.scale(scale, scale)

  if (sheetSize) {
    ctx.strokeStyle = SHEET_STROKE
    ctx.lineWidth = 1 / scale
    ctx.strokeRect(0, 0, sheetSize.width, sheetSize.height)
  }

  // Cuadrícula en espacio mundo (paso adaptativo al zoom, estilo FreeCAD/CAD)
  if (showGrid && gridStyle !== "none") {
    drawWorldGrid(ctx, view, w, h, scale, gridStyle)
  }

  const simActive = simProgress > 0.001
  const attenuate = simActive && simProgress < 0.999
  const selectedSet = new Set(selectedPieceIndices)
  const collidingSet = new Set(collidingPieceIndices)
  const dragSet =
    dragPreview && (Math.abs(dragPreview.dx) > 1e-12 || Math.abs(dragPreview.dy) > 1e-12)
      ? new Set(dragPreview.indices)
      : null
  const ddx = dragPreview?.dx ?? 0
  const ddy = dragPreview?.dy ?? 0

  ctx.globalAlpha = attenuate ? 0.28 : 1
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // Un solo pase: translate por pieza en drag (O(entidades), sin clonar arrays)
  for (const e of entities) {
    const isSelected = e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex)
    const isColliding = e.pieceIndex !== undefined && collidingSet.has(e.pieceIndex)
    const inDrag = dragSet !== null && e.pieceIndex !== undefined && dragSet.has(e.pieceIndex)

    ctx.strokeStyle = isColliding ? COLLISION_COLOR : isSelected ? SELECTED_STROKE : e.color
    ctx.fillStyle = e.color
    ctx.lineWidth = (isColliding || isSelected ? 1.8 : 1) / scale

    if (inDrag) {
      ctx.save()
      ctx.translate(ddx, ddy)
      strokeEntity(ctx, e, scale)
      ctx.restore()
    } else {
      strokeEntity(ctx, e, scale)
    }
  }
  ctx.globalAlpha = 1

  if (simActive) {
    const targetLen = simProgress * totalPathLength
    const headPoint = strokeToolpathUntil(
      ctx,
      toolpath,
      totalPathLength,
      fullPath2D,
      targetLen,
      scale
    )
    if (headPoint && simProgress < 0.999) {
      ctx.fillStyle = "#facc15"
      ctx.beginPath()
      ctx.arc(headPoint.x, headPoint.y, 4 / scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#facc15"
      ctx.lineWidth = 1 / scale
      ctx.beginPath()
      ctx.arc(headPoint.x, headPoint.y, 9 / scale, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // Nota: se retiró el halo dashed (SELECTED_HALO) del bbox de selección.
  // El contorno de la pieza ya cambia a SELECTED_STROKE (blanco) arriba,
  // eso es suficiente feedback visual sin el rectángulo punteado extra.

  for (const idx of collidingPieceIndices) {
    const collidingEntities = entities.filter((e) => e.pieceIndex === idx)
    const bounds = computeBounds(collidingEntities)
    if (bounds) {
      const pad = 4 / scale
      const shift = dragSet?.has(idx) ? { x: ddx, y: ddy } : { x: 0, y: 0 }
      ctx.strokeStyle = COLLISION_COLOR
      ctx.lineWidth = 2 / scale
      ctx.strokeRect(
        bounds.minX - pad + shift.x,
        bounds.minY - pad + shift.y,
        bounds.maxX - bounds.minX + pad * 2,
        bounds.maxY - bounds.minY + pad * 2
      )
    }
  }

  ctx.lineWidth = 1.5 / scale
  ctx.strokeStyle = MEASURE_COLOR
  ctx.fillStyle = MEASURE_COLOR

  for (const m of measurements) {
    if (m.kind === "distance") {
      drawCadDistance(ctx, m.a, m.b, m.offset, scale)
    } else if (m.kind === "radius") {
      ctx.save()
      ctx.strokeStyle = MEASURE_COLOR
      ctx.fillStyle = MEASURE_COLOR
      ctx.lineWidth = 1 / scale
      // círculo de referencia tenue
      ctx.setLineDash([3 / scale, 2 / scale])
      ctx.beginPath()
      ctx.arc(m.center.x, m.center.y, m.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      // leader centro → punto
      ctx.beginPath()
      ctx.moveTo(m.center.x, m.center.y)
      ctx.lineTo(m.anglePoint.x, m.anglePoint.y)
      ctx.stroke()
      // cruz en centro
      const c = 4 / scale
      ctx.beginPath()
      ctx.moveTo(m.center.x - c, m.center.y)
      ctx.lineTo(m.center.x + c, m.center.y)
      ctx.moveTo(m.center.x, m.center.y - c)
      ctx.lineTo(m.center.x, m.center.y + c)
      ctx.stroke()
      // punto en perímetro
      ctx.beginPath()
      ctx.arc(m.anglePoint.x, m.anglePoint.y, 2 / scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else if (m.kind === "angle") {
      ctx.setLineDash([4 / scale, 3 / scale])
      ctx.beginPath()
      ctx.moveTo(m.vertex.x, m.vertex.y)
      ctx.lineTo(m.p1.x, m.p1.y)
      ctx.moveTo(m.vertex.x, m.vertex.y)
      ctx.lineTo(m.p2.x, m.p2.y)
      ctx.stroke()
      ctx.setLineDash([])
      const r = 14 / scale
      const a1 = angleOfVector(m.vertex, m.p1)
      const a2 = angleOfVector(m.vertex, m.p2)
      ctx.beginPath()
      ctx.arc(m.vertex.x, m.vertex.y, r, a1, a2)
      ctx.stroke()
    } else if (m.kind === "area") {
      ctx.fillStyle = `${MEASURE_COLOR}22`
      ctx.strokeStyle = MEASURE_COLOR
      ctx.beginPath()
      m.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  if (pendingPoints.length > 0) {
    ctx.fillStyle = MEASURE_PENDING_COLOR
    ctx.strokeStyle = MEASURE_PENDING_COLOR
    ctx.lineWidth = 1 / scale
    for (const p of pendingPoints) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 / scale, 0, Math.PI * 2)
      ctx.fill()
    }
    if (pendingPoints.length === 1 && hoverLocal) {
      // Primer punto → línea guía al cursor + ejes ortho
      ctx.setLineDash([4 / scale, 3 / scale])
      ctx.beginPath()
      ctx.moveTo(pendingPoints[0].x, pendingPoints[0].y)
      ctx.lineTo(hoverLocal.x, hoverLocal.y)
      ctx.stroke()
      ctx.setLineDash([])
      const last = pendingPoints[0]
      const guideTol = 2 / scale
      ctx.strokeStyle = MEASURE_COLOR
      ctx.lineWidth = 0.75 / scale
      ctx.setLineDash([2 / scale, 3 / scale])
      if (Math.abs(hoverLocal.x - last.x) < guideTol) {
        ctx.beginPath()
        ctx.moveTo(last.x, last.y - 5000)
        ctx.lineTo(last.x, last.y + 5000)
        ctx.stroke()
      }
      if (Math.abs(hoverLocal.y - last.y) < guideTol) {
        ctx.beginPath()
        ctx.moveTo(last.x - 5000, last.y)
        ctx.lineTo(last.x + 5000, last.y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      // valor provisional
      const v = Math.hypot(hoverLocal.x - last.x, hoverLocal.y - last.y)
      if (v > 1e-3) {
        const mid = { x: (last.x + hoverLocal.x) / 2, y: (last.y + hoverLocal.y) / 2 }
        // label in screen space drawn later via measurements path — quick world text
        ctx.save()
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const sp = localToScreen(mid)
        const text = fmtMm(v)
        ctx.font = "11px ui-sans-serif, system-ui"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const metrics = ctx.measureText(text)
        ctx.fillStyle = "rgba(10,10,12,0.85)"
        ctx.fillRect(sp.x - metrics.width / 2 - 4, sp.y - 9, metrics.width + 8, 18)
        ctx.fillStyle = MEASURE_PENDING_COLOR
        ctx.fillText(text, sp.x, sp.y)
        ctx.restore()
        // restore world transform for rest of scene
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const { scale: sc, offsetX, offsetY } = d.view
        const w = d.canvasWidth
        const h = d.canvasHeight
        ctx.translate(w / 2 + offsetX, h / 2 + offsetY)
        ctx.scale(sc, sc)
      }
    } else if (pendingPoints.length >= 2) {
      // A+B fijos → preview cota con offset desde hover
      const [a, b] = pendingPoints
      let offset: number | undefined
      if (hoverLocal) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        offset = (hoverLocal.x - mid.x) * nx + (hoverLocal.y - mid.y) * ny
      }
      drawCadDistance(ctx, a, b, offset, scale)
    }
  }


  if (snapGuides && snapGuides.length > 0) {
    ctx.save()
    ctx.strokeStyle = "#f472b6"
    ctx.lineWidth = 1 / scale
    ctx.setLineDash([6 / scale, 4 / scale])
    for (const g of snapGuides) {
      ctx.beginPath()
      if (g.axis === "x") {
        ctx.moveTo(g.value, -50)
        ctx.lineTo(g.value, (sheetSize?.height ?? 10000) + 50)
      } else {
        ctx.moveTo(-50, g.value)
        ctx.lineTo((sheetSize?.width ?? 10000) + 50, g.value)
      }
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()
  }

  // Arista bajo el cursor (solo con herramienta de medida)
  if (
    snapCandidate?.segment &&
    activeTool !== "none" &&
    activeTool !== "coords"
  ) {
    drawHoverEdge(ctx, snapCandidate.segment, scale)
  }

  // Cota inteligente: preview de la medición ANTES de hacer click.
  // Con la herramienta de distancia activa y el cursor sobre una arista
  // (sin puntos elegidos todavía), se ve de una vez el valor + las líneas
  // de cota fantasma sobre esa arista — igual que "smart dimension" en
  // SolidWorks/Fusion. Un solo click sobre esto la confirma (ver
  // use-measurements.ts). Semitransparente para distinguirla de una cota
  // ya confirmada.
  if (
    activeTool === "distance" &&
    pendingPoints.length === 0 &&
    snapCandidate?.segment
  ) {
    const { a, b } = snapCandidate.segment
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len > 1e-3) {
      ctx.save()
      ctx.globalAlpha = 0.55
      drawCadDistance(ctx, a, b, 12, scale)
      ctx.restore()

      // Texto del valor en screen-space (mismo patrón que el label del
      // primer punto pendiente más arriba), para que no se deforme con
      // el zoom y quede siempre nítido/legible.
      const off = 12 / scale
      const dx = b.x - a.x
      const dy = b.y - a.y
      const nx = -dy / len
      const ny = dx / len
      const mid = {
        x: (a.x + b.x) / 2 + nx * off,
        y: (a.y + b.y) / 2 + ny * off,
      }
      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const sp = localToScreen(mid)
      const text = fmtMm(len)
      ctx.font = "11px ui-sans-serif, system-ui"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const metrics = ctx.measureText(text)
      ctx.globalAlpha = 0.85
      ctx.fillStyle = "rgba(10,10,12,0.85)"
      ctx.fillRect(sp.x - metrics.width / 2 - 4, sp.y - 9, metrics.width + 8, 18)
      ctx.fillStyle = MEASURE_PENDING_COLOR
      ctx.fillText(text, sp.x, sp.y)
      ctx.restore()
      // Restaurar transform de mundo para que el resto de la escena
      // (osnap marker, etc.) siga dibujándose en las coords correctas.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const { scale: sc2, offsetX: ox2, offsetY: oy2 } = d.view
      ctx.translate(d.canvasWidth / 2 + ox2, d.canvasHeight / 2 + oy2)
      ctx.scale(sc2, sc2)
    }
  }

  if (snapCandidate) {
    drawOsnapMarker(ctx, snapCandidate, scale)
  }

  ctx.restore()

  if (measurements.length > 0) {
    ctx.font = "11px ui-sans-serif, system-ui"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    for (const m of measurements) {
      let labelLocal: Point
      let text: string
      if (m.kind === "distance") {
        const dx = m.b.x - m.a.x
        const dy = m.b.y - m.a.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const off = m.offset ?? 14 / (d.view.scale || 1)
        labelLocal = {
          x: (m.a.x + m.b.x) / 2 + nx * off,
          y: (m.a.y + m.b.y) / 2 + ny * off,
        }
        text = fmtMm(m.value)
      } else if (m.kind === "radius") {
        labelLocal = m.anglePoint
        text = `R${m.radius.toFixed(1)} · ⌀${(m.radius * 2).toFixed(1)}`
      } else if (m.kind === "angle") {
        const midAngle = (angleOfVector(m.vertex, m.p1) + angleOfVector(m.vertex, m.p2)) / 2
        labelLocal = {
          x: m.vertex.x + Math.cos(midAngle) * 24,
          y: m.vertex.y + Math.sin(midAngle) * 24,
        }
        text = `${m.degrees.toFixed(1)}°`
      } else {
        labelLocal = m.centroid
        text = `${(m.area / 1_000_000).toFixed(4)}m² · P ${fmtMm(m.perimeter)}`
      }
      const screenPos = localToScreen(labelLocal)
      const metrics = ctx.measureText(text)
      const pad = 4
      ctx.fillStyle = "rgba(10,10,12,0.85)"
      ctx.fillRect(screenPos.x - metrics.width / 2 - pad, screenPos.y - 9, metrics.width + pad * 2, 18)
      ctx.fillStyle = MEASURE_COLOR
      ctx.fillText(text, screenPos.x, screenPos.y)
    }
  }

  if (activeTool === "coords" && hoverLocal && hoverScreen) {
    const text = `X ${hoverLocal.x.toFixed(1)}  Y ${hoverLocal.y.toFixed(1)}`
    ctx.font = "11px ui-sans-serif, system-ui"
    ctx.textAlign = "left"
    ctx.textBaseline = "bottom"
    const metrics = ctx.measureText(text)
    const px = hoverScreen.x + 14
    const py = hoverScreen.y - 10
    ctx.fillStyle = "rgba(10,10,12,0.85)"
    ctx.fillRect(px - 4, py - 16, metrics.width + 8, 20)
    ctx.fillStyle = MEASURE_COLOR
    ctx.fillText(text, px, py)
  }

  // Box select / zoom window overlay (coords CSS del canvas).
  // Debe usar el mismo transform dpr que el resto del scene; con identity
  // el rect queda en píxeles de dispositivo y se desfasaba al hacer zoom
  // de página (devicePixelRatio no entero).
  if (d.boxSelectScreen) {
    const { x0, y0, x1, y1 } = d.boxSelectScreen
    const x = Math.min(x0, x1)
    const y = Math.min(y0, y1)
    const w = Math.abs(x1 - x0)
    const h = Math.abs(y1 - y0)
    const rtl = x1 < x0 // derecha→izquierda = intersect
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = rtl ? "rgba(34, 197, 94, 0.12)" : "rgba(59, 130, 246, 0.12)"
    ctx.strokeStyle = rtl ? "rgba(34, 197, 94, 0.85)" : "rgba(59, 130, 246, 0.85)"
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
  }

}

import { angleOfVector, fmtMm, computeBounds } from "../geometry-utils"
import {
  aabbIntersects,
  viewportWorldAabb,
  getPathCache,
  strokeEntity,
  strokeToolpathUntil,
} from "./draw-entity-cache"
import { drawWorldGrid } from "./draw-grid"
import {
  findClearLabelOffset,
  drawCadDistance,
  drawHoverEdge,
  drawOsnapMarker,
} from "./draw-dimension-primitives"
import type {
  Entity,
  Measurement,
  Point,
  SnapCandidate,
  ToolpathSeg,
  ViewState,
} from "../../types/types"
import {
  COLLISION_COLOR,
  MEASURE_COLOR,
  MEASURE_PENDING_COLOR,
  SELECTED_STROKE,
  SHEET_STROKE,
} from "../../types/types"

// Re-exportado para no romper el import externo existente (dxf-canvas.tsx
// no lo usa hoy directamente, pero era `export` acá — se mantiene la
// misma superficie pública tras separar los archivos).
export { strokeToolpathUntil }

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
  /** Spans H/V por raycast (cota inteligente). */
  smartSpans?: {
    h: { a: { x: number; y: number }; b: { x: number; y: number }; value: number } | null
    v: { a: { x: number; y: number }; b: { x: number; y: number }; value: number } | null
    center: { x: number; y: number }
  } | null
  /** Contorno bajo el cursor con la herramienta de área activa. */
  areaHoverContour?: Point[] | null
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

  // Grilla en TODO el viewport (fondo infinito).
  // Borde de plancha DESPUÉS para que la grilla no lo tape.
  if (showGrid && gridStyle !== "none") {
    drawWorldGrid(ctx, view, w, h, scale, gridStyle)
  }

  if (sheetSize) {
    ctx.strokeStyle = SHEET_STROKE
    ctx.lineWidth = 1.5 / scale
    ctx.strokeRect(0, 0, sheetSize.width, sheetSize.height)
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

  // Path2D cache (rebuild solo si cambia `entities`) + culling de viewport.
  // En pan/zoom no se reconstruyen paths: solo stroke de los visibles.
  const cached = getPathCache(entities)
  const viewAabb = viewportWorldAabb(view, w, h)

  for (const item of cached) {
    const e = item.entity
    const isSelected = e.pieceIndex !== undefined && selectedSet.has(e.pieceIndex)
    const isColliding = e.pieceIndex !== undefined && collidingSet.has(e.pieceIndex)
    const inDrag = dragSet !== null && e.pieceIndex !== undefined && dragSet.has(e.pieceIndex)

    // Culling: si está fuera del viewport y no se está arrastrando, skip
    if (!inDrag && item.bounds && !aabbIntersects(item.bounds, viewAabb)) continue

    ctx.strokeStyle = isColliding ? COLLISION_COLOR : isSelected ? SELECTED_STROKE : e.color
    ctx.fillStyle = e.color
    ctx.lineWidth = (isColliding || isSelected ? 1.8 : 1) / scale

    if (e.kind === "text") {
      if (inDrag) {
        ctx.save()
        ctx.translate(ddx, ddy)
        strokeEntity(ctx, e, scale)
        ctx.restore()
      } else {
        strokeEntity(ctx, e, scale)
      }
      continue
    }

    const path = item.path
    if (!path) continue

    if (inDrag) {
      ctx.save()
      ctx.translate(ddx, ddy)
      ctx.stroke(path)
      ctx.restore()
    } else {
      ctx.stroke(path)
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

  // Nota: se retiró el halo dashed (SELECTED_HALO) del bbox de selección
  // y el strokeRect AABB rojo de colisión. La pieza en colisión ya se
  // pinta con COLLISION_COLOR en el stroke de sus entidades (arriba);
  // un rectángulo envolvente tapaba la geometría real.

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
      // ctx.arc() por defecto barre en sentido horario de a1 a a2 — eso
      // puede ser el ángulo reflejo (el largo, >180°) según en qué
      // cuadrante caiga cada rayo, mientras que `m.degrees` (el número
      // que se muestra) YA está normalizado al ángulo corto
      // (use-measurements.ts hace `if (degrees > 180) degrees = 360 -
      // degrees`). Sin esto, el arquito dibujado podía verse "dando la
      // vuelta" por fuera en vez de marcar el ángulo interior que dice
      // el número.
      const twoPi = Math.PI * 2
      const clockwiseDiff = ((a2 - a1) % twoPi + twoPi) % twoPi
      const sweepIsReflex = clockwiseDiff > Math.PI
      ctx.beginPath()
      ctx.arc(m.vertex.x, m.vertex.y, r, a1, a2, sweepIsReflex)
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

  // Preview de medición en curso — la "cota jalada" (drawCadDistance)
  // SOLO aplica a la regla (distance). Área/ángulo/radio no deben usarla.
  if (pendingPoints.length > 0 && activeTool === "distance") {

    ctx.fillStyle = MEASURE_PENDING_COLOR
    ctx.strokeStyle = MEASURE_PENDING_COLOR
    ctx.lineWidth = 1 / scale
    for (const p of pendingPoints) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 / scale, 0, Math.PI * 2)
      ctx.fill()
    }
    if (pendingPoints.length === 1 && hoverLocal) {
      // Primer punto → línea guía al cursor + ejes ortho (estilo FreeCAD).
      // Si el ángulo está cerca de H o V, sugerir línea dashed ortogonal y
      // usar el punto proyectado para el valor provisional.
      const last = pendingPoints[0]
      const dx = hoverLocal.x - last.x
      const dy = hoverLocal.y - last.y
      const adx = Math.abs(dx)
      const ady = Math.abs(dy)
      const ang = Math.atan2(ady, adx) // 0 = H, π/2 = V
      const ORTHO_TOL = (8 * Math.PI) / 180
      let drawTo = hoverLocal
      let isOrtho = false
      if (ang < ORTHO_TOL && adx > 1e-9) {
        drawTo = { x: hoverLocal.x, y: last.y }
        isOrtho = true
      } else if (ang > Math.PI / 2 - ORTHO_TOL && ady > 1e-9) {
        drawTo = { x: last.x, y: hoverLocal.y }
        isOrtho = true
      }

      ctx.strokeStyle = MEASURE_PENDING_COLOR
      ctx.lineWidth = 1 / scale
      ctx.setLineDash([4 / scale, 3 / scale])
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(drawTo.x, drawTo.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Ejes ortho infinitos dashed cuando está en modo sugerido
      if (isOrtho) {
        ctx.strokeStyle = MEASURE_COLOR
        ctx.lineWidth = 0.75 / scale
        ctx.setLineDash([3 / scale, 4 / scale])
        if (Math.abs(drawTo.x - last.x) < 1e-9) {
          // vertical
          ctx.beginPath()
          ctx.moveTo(last.x, last.y - 5000)
          ctx.lineTo(last.x, last.y + 5000)
          ctx.stroke()
        } else {
          // horizontal
          ctx.beginPath()
          ctx.moveTo(last.x - 5000, last.y)
          ctx.lineTo(last.x + 5000, last.y)
          ctx.stroke()
        }
        ctx.setLineDash([])
      }

      // valor provisional (usa punto ortogonal si aplica)
      const v = Math.hypot(drawTo.x - last.x, drawTo.y - last.y)
      if (v > 1e-3) {
        const mid = { x: (last.x + drawTo.x) / 2, y: (last.y + drawTo.y) / 2 }
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



  if (pendingPoints.length > 0 && activeTool === "angle") {
    ctx.fillStyle = MEASURE_PENDING_COLOR
    ctx.strokeStyle = MEASURE_PENDING_COLOR
    ctx.lineWidth = 1.25 / scale
    for (const p of pendingPoints) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 / scale, 0, Math.PI * 2)
      ctx.fill()
    }
    // El ángulo se mide EN el vértice (1er punto) entre los rayos hacia
    // el 2º y 3º punto — antes el preview dibujaba un camino conectado
    // (vértice → p1 → cursor, una sola línea quebrada que pasa POR p1),
    // dando la impresión visual de que el ángulo se abría en p1. Al
    // confirmar, la medición real es en el vértice entre 2 rayos
    // independientes — se sentía como que "se invertía" de golpe. Ahora
    // el preview dibuja esos mismos 2 rayos independientes desde el
    // vértice, para que se vea igual desde el primer momento.
    const vertex = pendingPoints[0]
    ctx.setLineDash([4 / scale, 3 / scale])
    ctx.beginPath()
    if (pendingPoints.length >= 2) {
      const p1 = pendingPoints[1]
      ctx.moveTo(vertex.x, vertex.y)
      ctx.lineTo(p1.x, p1.y)
    }
    if (hoverLocal && pendingPoints.length < 3) {
      ctx.moveTo(vertex.x, vertex.y)
      ctx.lineTo(hoverLocal.x, hoverLocal.y)
    }
    ctx.stroke()
    ctx.setLineDash([])
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

  // Área: relleno + contorno resaltado del hueco/pieza bajo el cursor.
  // Antes esta era la única herramienta sin ningún feedback visual al
  // pasar el mouse — como trabaja sobre un contorno completo (no un
  // punto), no tiene sentido el círculo amarillo de snap; se resalta
  // el contorno entero para que quede claro qué se va a medir al hacer
  // clic.
  if (activeTool === "area" && d.areaHoverContour && d.areaHoverContour.length >= 3) {
    ctx.save()
    ctx.beginPath()
    const pts = d.areaHoverContour
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.fillStyle = "rgba(250,204,21,0.15)"
    ctx.fill()
    ctx.strokeStyle = "#facc15"
    ctx.lineWidth = 1.5 / scale
    ctx.stroke()
    ctx.restore()
  }

  // Cota inteligente de ARISTA: solo con herramienta "smart" activa.
  // Preview fantasma de la arista bajo el cursor (sin clic).
  if (activeTool === "smart" && snapCandidate?.segment && !d.smartSpans) {
    const { a, b } = snapCandidate.segment
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len > 1e-3) {
      // `offset` en drawCadDistance está en mm (unidades mundo), no px —
      // antes la línea usaba 12mm fijo mientras la etiqueta calculaba su
      // posición en 12/scale (px convertidos a mundo), dos cosas
      // distintas que se iban desalineando con el zoom. Ahora ambas
      // usan el mismo `off`, ya resuelto contra espacio libre.
      const dx = b.x - a.x
      const dy = b.y - a.y
      const nx = -dy / len
      const ny = dx / len
      const midCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const off = findClearLabelOffset(midCenter, nx, ny, 12, d.entities)

      ctx.save()
      ctx.globalAlpha = 0.75
      drawCadDistance(ctx, a, b, off, scale)
      ctx.restore()

      const mid = {
        x: midCenter.x + nx * off,
        y: midCenter.y + ny * off,
      }
      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const sp = localToScreen(mid)
      const text = fmtMm(len)
      ctx.font = "11px ui-sans-serif, system-ui"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const metrics = ctx.measureText(text)
      ctx.globalAlpha = 0.9
      ctx.fillStyle = "rgba(10,10,12,0.85)"
      ctx.fillRect(sp.x - metrics.width / 2 - 4, sp.y - 9, metrics.width + 8, 18)
      ctx.fillStyle = MEASURE_PENDING_COLOR
      ctx.fillText(text, sp.x, sp.y)
      ctx.restore()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const { scale: sc2, offsetX: ox2, offsetY: oy2 } = d.view
      ctx.translate(d.canvasWidth / 2 + ox2, d.canvasHeight / 2 + oy2)
      ctx.scale(sc2, sc2)
    }
  }

  // Cota inteligente: cruz H/V por raycast a aristas reales + cotas.
  if (activeTool === "smart" && d.smartSpans) {
    const { h, v, center } = d.smartSpans
    const cx = center.x
    const cy = center.y

    ctx.save()
    ctx.strokeStyle = MEASURE_PENDING_COLOR
    ctx.lineWidth = 1 / scale
    ctx.setLineDash([4 / scale, 3 / scale])
    ctx.globalAlpha = 0.9
    if (h) {
      ctx.beginPath()
      ctx.moveTo(h.a.x, h.a.y)
      ctx.lineTo(h.b.x, h.b.y)
      ctx.stroke()
    }
    if (v) {
      ctx.beginPath()
      ctx.moveTo(v.a.x, v.a.y)
      ctx.lineTo(v.b.x, v.b.y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    const tick = 4 / scale
    ctx.lineWidth = 1.25 / scale
    const ends: { x: number; y: number; horiz: boolean }[] = []
    if (h) {
      ends.push({ x: h.a.x, y: h.a.y, horiz: false }, { x: h.b.x, y: h.b.y, horiz: false })
    }
    if (v) {
      ends.push({ x: v.a.x, y: v.a.y, horiz: true }, { x: v.b.x, y: v.b.y, horiz: true })
    }
    for (const e of ends) {
      ctx.beginPath()
      if (e.horiz) {
        ctx.moveTo(e.x - tick, e.y)
        ctx.lineTo(e.x + tick, e.y)
      } else {
        ctx.moveTo(e.x, e.y - tick)
        ctx.lineTo(e.x, e.y + tick)
      }
      ctx.stroke()
    }
    ctx.fillStyle = MEASURE_PENDING_COLOR
    ctx.beginPath()
    ctx.arc(cx, cy, 3 / scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const dims = [h, v].filter(Boolean) as {
      a: { x: number; y: number }
      b: { x: number; y: number }
      value: number
    }[]
    for (const dim of dims) {
      if (dim.value < 1e-3) continue
      const len = dim.value
      const dx = dim.b.x - dim.a.x
      const dy = dim.b.y - dim.a.y
      const l = Math.hypot(dx, dy) || 1
      const nx = -dy / l
      const ny = dx / l
      const midCenter = { x: (dim.a.x + dim.b.x) / 2, y: (dim.a.y + dim.b.y) / 2 }
      const off = findClearLabelOffset(midCenter, nx, ny, 12, d.entities)

      ctx.save()
      ctx.globalAlpha = 0.85
      drawCadDistance(ctx, dim.a, dim.b, off, scale)
      ctx.restore()

      const mid = {
        x: midCenter.x + nx * off,
        y: midCenter.y + ny * off,
      }
      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const sp = localToScreen(mid)
      const text = fmtMm(len)
      ctx.font = "11px ui-sans-serif, system-ui"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const metrics = ctx.measureText(text)
      ctx.globalAlpha = 0.95
      ctx.fillStyle = "rgba(10,10,12,0.9)"
      ctx.fillRect(sp.x - metrics.width / 2 - 4, sp.y - 9, metrics.width + 8, 18)
      ctx.fillStyle = MEASURE_PENDING_COLOR
      ctx.fillText(text, sp.x, sp.y)
      ctx.restore()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const { scale: sc3, offsetX: ox3, offsetY: oy3 } = d.view
      ctx.translate(d.canvasWidth / 2 + ox3, d.canvasHeight / 2 + oy3)
      ctx.scale(sc3, sc3)
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
        // Antes: offset de 24 fijo en mm de mundo, sin dividir por el
        // scale (a diferencia de "distance", que sí lo hace). Con zoom
        // alto esos 24mm se convertían en muchos px de pantalla —
        // la etiqueta se veía "lejos" del vértice. Mismo criterio que
        // distance: dividir por scale para que sea una distancia
        // visual constante sin importar el zoom.
        const angleLabelOff = 24 / (d.view.scale || 1)
        labelLocal = {
          x: m.vertex.x + Math.cos(midAngle) * angleLabelOff,
          y: m.vertex.y + Math.sin(midAngle) * angleLabelOff,
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
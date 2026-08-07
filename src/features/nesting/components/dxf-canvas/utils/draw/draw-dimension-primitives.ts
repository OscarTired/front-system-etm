import { pointInPolygon } from "../geometry-utils"
import type { Entity, Point } from "../../types/types"
import { MEASURE_COLOR } from "../../types/types"

/**
 * Las etiquetas de cota (el texto con el valor en mm) se dibujaban
 * siempre al mismo offset fijo desde la línea medida, sin importar si
 * eso las hacía caer encima del relleno/aristas de una pieza — se veía
 * "pegado" a las líneas del dibujo en vez de quedar en un hueco vacío
 * como en un plano real.
 *
 * Esto prueba unos pocos offsets candidatos (más lejos, y del otro
 * lado de la línea) y devuelve el primero cuyo punto central NO caiga
 * dentro de ninguna pieza. Si ninguno tiene espacio libre, devuelve el
 * offset original (mejor mostrar la cota superpuesta que no mostrarla).
 */
export function findClearLabelOffset(
  mid: Point,
  nx: number,
  ny: number,
  baseOffset: number,
  entities: Entity[],
): number {
  const pieceLoops: Point[][] = []
  for (const e of entities) {
    if (e.kind === "polyline" && e.closed && e.points.length >= 3) {
      pieceLoops.push(e.points)
    }
  }
  if (pieceLoops.length === 0) return baseOffset

  const sign = baseOffset >= 0 ? 1 : -1
  const mag = Math.abs(baseOffset)
  // Mismo lado más lejos → lado opuesto más cerca → lado opuesto más lejos.
  const candidates = [
    baseOffset,
    sign * mag * 1.8,
    sign * mag * 2.6,
    -sign * mag,
    -sign * mag * 1.8,
    -sign * mag * 2.6,
  ]
  for (const off of candidates) {
    const p = { x: mid.x + nx * off, y: mid.y + ny * off }
    const inside = pieceLoops.some((loop) => pointInPolygon(p, loop))
    if (!inside) return off
  }
  return baseOffset
}

/** Cota estilo AutoCAD: extensiones sólidas + línea de cota + flechas + ticks. */
export function drawCadDistance(
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
export function drawHoverEdge(
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
export function drawOsnapMarker(
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
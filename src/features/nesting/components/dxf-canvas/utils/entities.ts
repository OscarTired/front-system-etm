import type { Entity, LayerInfo, NestingPieceInput, ToolpathSeg } from "../types/types"

/** Convierte piezas de nesting en entidades de dibujo, respetando capas ocultas. */
export function piecesToEntities(
  pieces: NestingPieceInput[],
  hiddenKeys?: string[]
): Entity[] {
  const hidden = new Set((hiddenKeys ?? []).map((k) => k.toUpperCase()))
  const out: Entity[] = []

  pieces.forEach((piece, pieceIndex) => {
    if (piece.subOutlines.length > 0) {
      for (const sub of piece.subOutlines) {
        const color = sub.color ?? "#22c55e"
        const layerKey = (sub.layer ?? color).toUpperCase()
        if (hidden.has(layerKey) || hidden.has(color.toUpperCase())) continue
        if (sub.points.length >= 2) {
          const pts = sub.points
          const loopClosed =
            pts.length >= 3 &&
            Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 1e-3
          out.push({
            kind: "polyline",
            points: pts,
            // Antes: `closed: loopClosed || pts.length >= 3` — forzaba
            // cerrado a CUALQUIER fragmento de 3+ puntos, incluso un
            // arco abierto de 180° que no era un loop. Eso dibujaba una
            // línea recta extra uniendo sus dos puntas (la cuerda del
            // arco). Ahora que dxf-parser.ts encadena los fragmentos
            // sueltos en contornos completos antes de llegar acá,
            // confiar en loopClosed (la distancia real entre el primer
            // y el último punto) es seguro y correcto.
            closed: loopClosed,
            color,
            pieceIndex,
            layer: sub.layer,
          })
        }
      }
    } else if (piece.outline && piece.outline.length >= 2) {
      out.push({
        kind: "polyline",
        points: piece.outline,
        closed: true,
        color: "#22c55e",
        pieceIndex,
      })
    }
  })

  return out
}

/**
 * Toolpath de corte: cada entidad tesselada + longitud acumulada.
 * También construye un Path2D del recorrido completo para stroke barato al 100%.
 */
export function buildToolpath(entities: Entity[], arcSegments = 24): {
  segments: ToolpathSeg[]
  totalLength: number
  fullPath: Path2D | null
} {
  const segments: ToolpathSeg[] = []
  const fullPath = new Path2D()
  let cumLen = 0

  for (const e of entities) {
    let pts: { x: number; y: number }[] | null = null

    if (e.kind === "line") {
      pts = [e.a, e.b]
    } else if (e.kind === "polyline") {
      pts = e.closed ? [...e.points, e.points[0]] : e.points
    } else if (e.kind === "circle") {
      pts = Array.from({ length: arcSegments + 1 }, (_, i) => {
        const a = (i / arcSegments) * Math.PI * 2
        return {
          x: e.center.x + Math.cos(a) * e.radius,
          y: e.center.y + Math.sin(a) * e.radius,
        }
      })
    } else if (e.kind === "arc") {
      pts = Array.from({ length: arcSegments + 1 }, (_, i) => {
        const a = e.startAngle + (i / arcSegments) * (e.endAngle - e.startAngle)
        return {
          x: e.center.x + Math.cos(a) * e.radius,
          y: e.center.y + Math.sin(a) * e.radius,
        }
      })
    }

    if (!pts || pts.length < 2) continue

    let segLen = 0
    fullPath.moveTo(pts[0].x, pts[0].y)
    for (let i = 0; i < pts.length - 1; i++) {
      fullPath.lineTo(pts[i + 1].x, pts[i + 1].y)
      segLen += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
    }

    segments.push({ points: pts, startLen: cumLen, endLen: cumLen + segLen })
    cumLen += segLen
  }

  return {
    segments,
    totalLength: cumLen,
    fullPath: cumLen > 0 ? fullPath : null,
  }
}

/** Lista de capas distintas (por nombre DXF o color) para el gestor de capas. */
export function computeLayerList(pieces: NestingPieceInput[]): LayerInfo[] {
  const map = new Map<string, LayerInfo>()
  for (const piece of pieces) {
    for (const sub of piece.subOutlines) {
      const color = sub.color ?? "#22c55e"
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
import type { Point2D } from "../engine/types"
import { classifyDxfColor } from "./classify-dxf-color"
import { emptyCadData, type CadData, type CadEntity } from "./types"
import { sampleArc, sampleBulgeArc, sampleCircle } from "./geometry-sampling"

interface PolyVertex {
  x: number
  y: number
  bulge: number
}

/** Tolerancia (mm) para considerar que dos extremos son "el mismo punto". */
const CHAIN_EPS = 0.01

function samePoint(a: Point2D, b: Point2D): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < CHAIN_EPS
}

function chainFragments(fragments: Point2D[][]): { points: Point2D[]; closed: boolean }[] {
  const used = new Array(fragments.length).fill(false)
  const chains: { points: Point2D[]; closed: boolean }[] = []

  for (let i = 0; i < fragments.length; i++) {
    if (used[i]) continue
    used[i] = true
    let chain = [...fragments[i]]

    let extended = true
    while (extended) {
      extended = false
      const start = chain[0]
      const end = chain[chain.length - 1]
      if (chain.length > 2 && samePoint(start, end)) break // ya cerró

      for (let j = 0; j < fragments.length; j++) {
        if (used[j]) continue
        const frag = fragments[j]
        const fStart = frag[0]
        const fEnd = frag[frag.length - 1]

        if (samePoint(end, fStart)) {
          chain = chain.concat(frag.slice(1))
        } else if (samePoint(end, fEnd)) {
          chain = chain.concat([...frag].reverse().slice(1))
        } else if (samePoint(start, fEnd)) {
          chain = frag.slice(0, -1).concat(chain)
        } else if (samePoint(start, fStart)) {
          chain = [...frag].reverse().slice(0, -1).concat(chain)
        } else {
          continue
        }
        used[j] = true
        extended = true
        break
      }
    }

    const closed = chain.length > 2 && samePoint(chain[0], chain[chain.length - 1])
    chains.push({ points: chain, closed })
  }

  return chains
}

/**
 * Linetypes DXF estándar para líneas de centro/referencia (código 6),
 * nunca geometría real a cortar — convención universal de dibujo CAD.
 */
const CONSTRUCTION_LINETYPE_SUBSTRINGS = ["CENTER", "PHANTOM", "DASHDOT"]

function isConstructionLinetype(linetype: string): boolean {
  const upper = linetype.toUpperCase()
  return CONSTRUCTION_LINETYPE_SUBSTRINGS.some((s) => upper.includes(s))
}

/**
 * Puerto de DxfParser::parse (C++/Qt) a TypeScript puro. Recibe el
 * contenido ya leído del archivo .dxf (texto plano) y devuelve la
 * misma estructura CadData que el resto del pipeline de nesting espera.
 */
export function parseDxf(fileContent: string): CadData {
  const lines = fileContent.split(/\r\n|\r|\n/).map((l) => l.trim())

  let currentType = ""
  let currentLayer = "0"
  let currentColor = 256
  let currentLinetype = "CONTINUOUS"
  let extZ = 1.0 // Vector Z: detecta piezas exportadas "volteadas" desde el CAD

  let x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0
  let cx = 0,
    cy = 0,
    r = 0,
    startAng = 0,
    endAng = 0

  let polyVertices: PolyVertex[] = []
  let isClosedPoly = false
  let inOldPolyline = false

  const entities: CadEntity[] = []
  const allPoints: Point2D[] = []

  const commitEntity = () => {
    // Aplica el flip de extrusión Z si el CAD exportó la entidad "volteada".
    if (extZ < 0) {
      x1 = -x1
      x2 = -x2
      cx = -cx
      const tmpStart = 180.0 - endAng
      const tmpEnd = 180.0 - startAng
      startAng = tmpStart
      endAng = tmpEnd
      polyVertices = polyVertices.map((v) => ({ x: -v.x, y: v.y, bulge: -v.bulge }))
    }

    let points: Point2D[] = []

    if (currentType === "LINE") {
      if (Math.abs(x1 - x2) > 0.001 || Math.abs(y1 - y2) > 0.001) {
        points = [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ]
      }
    } else if (currentType === "ARC") {
      if (r > 0.001) {
        points = sampleArc(cx, cy, r, startAng, endAng)
      }
    } else if (currentType === "CIRCLE") {
      if (r > 0.001) {
        points = sampleCircle(cx, cy, r)
      }
    } else if ((currentType === "LWPOLYLINE" || currentType === "POLYLINE") && polyVertices.length > 0) {
      const verts = [...polyVertices]
      if (isClosedPoly && verts.length > 2) verts.push(verts[0])

      for (let i = 0; i < verts.length - 1; i++) {
        const p1: Point2D = { x: verts[i].x, y: verts[i].y }
        const p2: Point2D = { x: verts[i + 1].x, y: verts[i + 1].y }
        const bulge = verts[i].bulge

        if (i === 0) points.push(p1)

        if (Math.abs(bulge) < 0.0001) {
          points.push(p2)
        } else {
          points.push(...sampleBulgeArc(p1, p2, bulge))
        }
      }
    }

    if (points.length > 0 && !isConstructionLinetype(currentLinetype)) {
      const color = classifyDxfColor(currentLayer, currentColor)
      entities.push({ outline: { points }, layer: currentLayer, color })
      allPoints.push(...points)
    }

    currentType = ""
    currentLinetype = "CONTINUOUS"
    polyVertices = []
    isClosedPoly = false
    extZ = 1.0
  }

  for (let i = 0; i < lines.length; i += 2) {
    const codeStr = lines[i]
    const valStr = lines[i + 1] ?? ""
    if (!codeStr) continue
    const code = parseInt(codeStr, 10)

    if (code === 0) {
      if (valStr === "VERTEX") {
        polyVertices.push({ x: 0, y: 0, bulge: 0 })
      } else if (valStr === "SEQEND") {
        currentType = "POLYLINE"
        commitEntity()
        inOldPolyline = false
      } else {
        if (!inOldPolyline) commitEntity()

        if (valStr === "LINE" || valStr === "ARC" || valStr === "CIRCLE" || valStr === "LWPOLYLINE") {
          currentType = valStr
          currentLayer = "0"
          currentColor = 256
          currentLinetype = "CONTINUOUS"
          extZ = 1.0
          x1 = y1 = x2 = y2 = cx = cy = r = startAng = endAng = 0
          inOldPolyline = false
        } else if (valStr === "POLYLINE") {
          inOldPolyline = true
          currentLayer = "0"
          currentColor = 256
          currentLinetype = "CONTINUOUS"
          extZ = 1.0
          polyVertices = []
          isClosedPoly = false
        }
      }
    } else if (code === 8) {
      currentLayer = valStr
    } else if (code === 6) {
      currentLinetype = valStr
    } else if (code === 62) {
      currentColor = parseInt(valStr, 10)
    } else if (code === 230) {
      extZ = parseFloat(valStr)
    } else if (currentType === "LINE") {
      if (code === 10) x1 = parseFloat(valStr)
      else if (code === 20) y1 = parseFloat(valStr)
      else if (code === 11) x2 = parseFloat(valStr)
      else if (code === 21) y2 = parseFloat(valStr)
    } else if (currentType === "ARC" || currentType === "CIRCLE") {
      if (code === 10) cx = parseFloat(valStr)
      else if (code === 20) cy = parseFloat(valStr)
      else if (code === 40) r = parseFloat(valStr)
      else if (code === 50) startAng = parseFloat(valStr)
      else if (code === 51) endAng = parseFloat(valStr)
    } else if (currentType === "LWPOLYLINE") {
      if (code === 70) {
        if ((parseInt(valStr, 10) & 1) === 1) isClosedPoly = true
      } else if (code === 10) {
        polyVertices.push({ x: parseFloat(valStr), y: 0, bulge: 0 })
      } else if (code === 20 && polyVertices.length > 0) {
        polyVertices[polyVertices.length - 1].y = parseFloat(valStr)
      } else if (code === 42 && polyVertices.length > 0) {
        polyVertices[polyVertices.length - 1].bulge = parseFloat(valStr)
      }
    } else if (inOldPolyline) {
      if (code === 70 && polyVertices.length === 0) {
        if ((parseInt(valStr, 10) & 1) === 1) isClosedPoly = true
      } else if (code === 10 && polyVertices.length > 0) {
        polyVertices[polyVertices.length - 1].x = parseFloat(valStr)
      } else if (code === 20 && polyVertices.length > 0) {
        polyVertices[polyVertices.length - 1].y = parseFloat(valStr)
      } else if (code === 42 && polyVertices.length > 0) {
        polyVertices[polyVertices.length - 1].bulge = parseFloat(valStr)
      }
    }
  }
  commitEntity()

  if (allPoints.length === 0) return emptyCadData()

  // Encadenar fragmentos sueltos que en realidad forman un solo
  // contorno continuo (ver chainFragments arriba). Se agrupa por
  // capa+color para no mezclar, por ejemplo, una línea de corte con
  // una de marca/doblez aunque geométricamente se toquen.
  const groups = new Map<string, { layer: string; color: string; frags: Point2D[][] }>()
  for (const e of entities) {
    const key = `${e.layer}\u0000${e.color}`
    const g = groups.get(key)
    if (g) g.frags.push(e.outline.points)
    else groups.set(key, { layer: e.layer, color: e.color, frags: [e.outline.points] })
  }

  const chainedEntities: CadEntity[] = []
  for (const { layer, color, frags } of groups.values()) {
    for (const chain of chainFragments(frags)) {
      chainedEntities.push({ outline: { points: chain.points }, layer, color })
    }
  }

  // Bounding box + normalizado a origen (0,0). El original también
  // invierte Y acá porque Qt dibuja con Y hacia abajo; nuestro modelo
  // de puntos no tiene esa restricción, así que solo normalizamos.
  let minX = allPoints[0].x,
    maxX = allPoints[0].x,
    minY = allPoints[0].y,
    maxY = allPoints[0].y

  for (const p of allPoints) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const width = maxX - minX
  const height = maxY - minY
  const normalize = (p: Point2D): Point2D => ({ x: p.x - minX, y: p.y - minY })

  const normalizedEntities = chainedEntities.map((e) => ({
    ...e,
    outline: { points: e.outline.points.map(normalize) },
  }))

  return {
    outline: { points: allPoints.map(normalize) },
    entities: normalizedEntities,
    width,
    height,
    valid: true,
  }
}
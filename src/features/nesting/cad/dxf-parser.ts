import type { Point2D } from "../engine/types"
import { classifyDxfColor, CUT_COLOR } from "./classify-dxf-color"
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

interface Fragment {
  points: Point2D[]
  layer: string
  color: string
  /** true si es el tramo sintético que "cierra" una polilínea marcada
   * como cerrada en el DXF — candidato a anularse si coincide con el
   * cierre de otra polilínea (ver el comentario en commitEntity). */
  isClosingEdge: boolean
}

function chainFragments(fragments: Fragment[]): { points: Point2D[]; closed: boolean; layer: string; color: string }[] {
  const used = new Array(fragments.length).fill(false)
  const chains: { points: Point2D[]; closed: boolean; layer: string; color: string }[] = []

  for (let i = 0; i < fragments.length; i++) {
    if (used[i]) continue
    used[i] = true
    let chain = [...fragments[i].points]
    const memberIdx = [i]

    let extended = true
    while (extended) {
      extended = false
      const start = chain[0]
      const end = chain[chain.length - 1]
      if (chain.length > 2 && samePoint(start, end)) break // ya cerró

      for (let j = 0; j < fragments.length; j++) {
        if (used[j]) continue
        const frag = fragments[j].points
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
        memberIdx.push(j)
        extended = true
        break
      }
    }

    const closed = chain.length > 2 && samePoint(chain[0], chain[chain.length - 1])
    // Encadenar es puramente geométrico (por eso se ignora layer/color
    // al buscar quién conecta con quién): un DXF real a veces tiene un
    // tramo de UN MISMO contorno de corte con un color/capa distinto
    // al resto por error de dibujo (ej. un arco quedó en la capa de
    // marca/doblez por accidente) — si agrupábamos por capa+color
    // ANTES de encadenar, ese tramo quedaba separado del resto y la
    // pieza se veía "partida" (mitad de un color, mitad de otro).
    // Ya con la cadena geométrica completa, se decide la clasificación
    // UNA vez: si algún fragmento del contorno es de corte, el
    // contorno completo es de corte (un tramo mal coloreado no debe
    // convertir en "no cortable" el resto de un perfil real);
    // si todos sus fragmentos son de marca, se mantiene como marca.
    const members = memberIdx.map((k) => fragments[k])
    const anyCut = members.some((f) => f.color === CUT_COLOR)
    const color = anyCut ? CUT_COLOR : members[0].color
    const layer = anyCut
      ? (members.find((f) => f.color === CUT_COLOR)?.layer ?? members[0].layer)
      : members[0].layer

    chains.push({ points: chain, closed, layer, color })
  }

  return chains
}

/**
 * Si dos fragmentos "de cierre" (ver isClosingEdge) tienen los mismos
 * 2 extremos (en cualquier orden), son la misma arista compartida
 * internamente entre dos mitades de un contorno — se anulan ambos.
 * Lo que sobra sigue de largo hacia chainFragments tal cual.
 */
function cancelDuplicateClosingEdges(fragments: Fragment[]): Fragment[] {
  const keyOf = (f: Fragment) => {
    const a = f.points[0]
    const b = f.points[f.points.length - 1]
    // Redondeo a la tolerancia de encadenado para que el orden de los
    // extremos no importe y para tolerar el mismo ruido numérico que
    // ya tolera samePoint().
    const round = (v: number) => Math.round(v / CHAIN_EPS) * CHAIN_EPS
    const pa = `${round(a.x)},${round(a.y)}`
    const pb = `${round(b.x)},${round(b.y)}`
    return pa < pb ? `${pa}|${pb}` : `${pb}|${pa}`
  }

  const byKey = new Map<string, number[]>()
  fragments.forEach((f, i) => {
    if (!f.isClosingEdge) return
    const k = keyOf(f)
    const list = byKey.get(k)
    if (list) list.push(i)
    else byKey.set(k, [i])
  })

  const cancelled = new Set<number>()
  for (const idxs of byKey.values()) {
    // Anular de a pares; si queda 1 suelto (sin pareja), se conserva.
    for (let n = 0; n + 1 < idxs.length; n += 2) {
      cancelled.add(idxs[n])
      cancelled.add(idxs[n + 1])
    }
  }

  return fragments.filter((_, i) => !cancelled.has(i))
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

  const rawFragments: Fragment[] = []
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
    let closingEdge: Point2D[] | null = null

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

      // El tramo que "cierra" la polilínea (del último vértice de
      // vuelta al primero) se guarda APARTE en vez de pegarlo al mismo
      // array de puntos. Motivo: un "ojo chino"/óvalo real a veces
      // viene en el DXF como DOS polilíneas separadas (mitad superior
      // e inferior), cada una marcada individualmente como "cerrada"
      // — cada mitad se autocierra con una cuerda recta por su lado
      // en vez de conectarse con la otra mitad. Si esa cuerda de
      // cierre coincide (mismos 2 extremos) con la cuerda de cierre de
      // OTRA polilínea, son la misma arista compartida internamente:
      // se anulan las dos más abajo, dejando las mitades libres para
      // encadenarse en un solo contorno real.
      if (isClosedPoly && verts.length > 2 && points.length > 0) {
        const last = verts[verts.length - 1]
        const first = verts[0]
        const bulge = last.bulge
        const p1: Point2D = { x: last.x, y: last.y }
        const p2: Point2D = { x: first.x, y: first.y }
        closingEdge = Math.abs(bulge) < 0.0001 ? [p1, p2] : [p1, ...sampleBulgeArc(p1, p2, bulge)]
      }
    }

    if (points.length > 0 && !isConstructionLinetype(currentLinetype)) {
      const color = classifyDxfColor(currentLayer, currentColor)
      rawFragments.push({ points, layer: currentLayer, color, isClosingEdge: false })
      allPoints.push(...points)
      if (closingEdge) {
        rawFragments.push({ points: closingEdge, layer: currentLayer, color, isClosingEdge: true })
        allPoints.push(...closingEdge)
      }
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

  // 1) Anular pares de aristas de cierre duplicadas (mitades de un
  //    mismo contorno que el DXF cerró cada una por su lado — ver
  //    isClosingEdge). 2) Encadenar TODOS los fragmentos restantes en
  //    un solo pool geométrico (ver el comentario dentro de
  //    chainFragments sobre por qué ya no se agrupa por capa+color
  //    antes de esto).
  const survivingFragments = cancelDuplicateClosingEdges(rawFragments)
  const chains = chainFragments(survivingFragments)
  const chainedEntities: CadEntity[] = chains.map((c) => ({
    outline: { points: c.points },
    layer: c.layer,
    color: c.color,
  }))

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
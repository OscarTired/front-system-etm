import type { Point2D } from "../engine/types"
import { CUT_COLOR } from "./classify-dxf-color"

/**
 * Lógica de encadenado de fragmentos geométricos sueltos (línea, arco,
 * polilínea) en contornos continuos — compartida entre TODOS los
 * formatos de entrada (DXF, GEO/TruTops, y cualquier otro futuro).
 *
 * Antes esta lógica vivía SOLO dentro de dxf-parser.ts: un archivo
 * .geo (TruTops) pasaba por un parser completamente distinto
 * (geo-parser.ts) que nunca la tenía, así que cada LIN/ARC/CIR del
 * .geo quedaba como su propio fragmento suelto sin conectar con nada
 * — el mismo bug que ya se había arreglado para DXF, pero intacto
 * para GEO. Extraído acá para que un fix futuro aplique en los dos
 * formatos a la vez, no en uno solo.
 */

/** Tolerancia (mm) para considerar que dos extremos son "el mismo punto". */
export const CHAIN_EPS = 0.01

export function samePoint(a: Point2D, b: Point2D): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < CHAIN_EPS
}

export interface Fragment {
  points: Point2D[]
  layer: string
  color: string
  /**
   * true si es el tramo sintético que "cierra" una polilínea marcada
   * como cerrada en el archivo de origen — candidato a anularse si
   * coincide con el cierre de otra polilínea (ver
   * cancelDuplicateClosingEdges). Los formatos que no tienen este
   * concepto (ej. GEO, donde cada LIN/ARC ya es un tramo explícito)
   * simplemente no generan fragmentos con esto en true.
   */
  isClosingEdge: boolean
}

export interface Chain {
  points: Point2D[]
  closed: boolean
  layer: string
  color: string
}

/**
 * Une fragmentos sueltos (línea, arco, polilínea) que se tocan en sus
 * extremos en contornos continuos. Puramente geométrico: no importa
 * el layer/color de cada fragmento individual al decidir quién
 * conecta con quién — un archivo real a veces tiene un tramo de UN
 * MISMO contorno de corte con un color/capa distinto al resto por
 * error de dibujo (ej. un arco quedó en la capa de marca/doblez por
 * accidente); si agrupáramos por capa+color ANTES de encadenar, ese
 * tramo quedaría separado del resto y la pieza se vería "partida"
 * (mitad de un color, mitad de otro).
 *
 * Ya con la cadena geométrica completa, se decide la clasificación
 * UNA vez: si algún fragmento del contorno es de corte, el contorno
 * completo es de corte (un tramo mal coloreado no debe convertir en
 * "no cortable" el resto de un perfil real); si todos sus fragmentos
 * son de marca, se mantiene como marca.
 */
export function chainFragments(fragments: Fragment[]): Chain[] {
  const used = new Array(fragments.length).fill(false)
  const chains: Chain[] = []

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
 * Si dos fragmentos "de cierre" (ver Fragment.isClosingEdge) tienen
 * los mismos 2 extremos (en cualquier orden), son la misma arista
 * compartida internamente entre dos mitades de un contorno que el
 * archivo de origen cerró cada una por su lado — se anulan ambos. Lo
 * que sobra sigue de largo hacia chainFragments tal cual.
 */
export function cancelDuplicateClosingEdges(fragments: Fragment[]): Fragment[] {
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
 * Atajo para el caso común: anular cierres duplicados y encadenar en
 * un solo paso.
 */
export function chainAndDedupe(fragments: Fragment[]): Chain[] {
  return chainFragments(cancelDuplicateClosingEdges(fragments))
}
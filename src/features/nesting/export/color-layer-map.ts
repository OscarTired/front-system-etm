export interface CypCutLayer {
  name: string
  /** Código de color ACI para DXF. */
  dxfColor: number
  /** Identificador de capa para el formato NSP. */
  nspLayer: string
}

// Puerto de mapearColorCypCut. El original reconoce 4 categorías por
// color RGB (verde=corte principal, naranja=doblez/marca,
// índigo/periwinkle=corte interno, gris=no cortar). Mi pipeline de
// import (DxfParser/GeoParser) hoy solo produce 2 de esas 4
// (CUT_COLOR/MARK_COLOR — ver classify-dxf-color.ts), porque las otras
// dos categorías en el original nacen de que el operador reclasifica
// una línea a mano en el editor CAD interactivo (CadScene), algo que
// todavía no existe en esta migración. Dejo las 4 categorías ya
// resueltas acá para que, el día que se construya el editor
// interactivo, no haga falta tocar el exportador — solo empezar a
// producir esos otros 2 colores en el import/edición.
const MARK_COLOR = "#FFA500" // naranja: doblez/marca
const CUT_INTERNAL_COLOR = "#4B0082" // índigo/periwinkle: corte interno (reservado, ver nota arriba)
const NO_CUT_COLOR = "#808080" // gris: no cortar (reservado, ver nota arriba)

export function mapColorToCypCutLayer(color: string): CypCutLayer {
  const normalized = color.toUpperCase()

  if (normalized === MARK_COLOR) {
    return { name: "MARCA_DOBLEZ", dxfColor: 30, nspLayer: "8" }
  }

  if (normalized === CUT_INTERNAL_COLOR) {
    return { name: "CORTE_INTERNO", dxfColor: 4, nspLayer: "4" }
  }

  if (normalized === NO_CUT_COLOR) {
    return { name: "NO_CORTAR", dxfColor: 8, nspLayer: "16" }
  }

  // Por defecto (incluye el verde de corte principal): CORTE_PRINCIPAL.
  return { name: "CORTE_PRINCIPAL", dxfColor: 3, nspLayer: "1" }
}

/**
 * Algoritmo de resolución de nombre de capa para exportar: en archivos
 * reales de producción (confirmado comparando contra un .nsp real),
 * `tlayerb` usa el nombre de capa ORIGINAL del DXF/GEO de origen (ej.
 * "SPI_UNF-BL"), no una categoría genérica — el software de la máquina
 * puede depender de ese nombre exacto para comportamientos específicos
 * por capa (ej. reconocer líneas de doblez de una marca de máquina en
 * particular).
 *
 * Regla: si la entidad trae una capa real y con significado (no vacía,
 * no la capa "0" por defecto de DXF), se usa esa. Si no hay capa real
 * — rectángulos manuales, o cualquier entidad sin origen CAD — se cae
 * a la categoría fija (MARCA_DOBLEZ / CORTE_PRINCIPAL / etc.), que
 * sigue siendo información útil aunque no sea el nombre original.
 */
export function resolveLayerName(sourceLayer: string | undefined, category: CypCutLayer): string {
  if (sourceLayer && sourceLayer !== "0" && sourceLayer.trim() !== "") {
    return sourceLayer
  }
  return category.name
}

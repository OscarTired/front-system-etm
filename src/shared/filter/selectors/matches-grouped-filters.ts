import type {
  FilterChip,
} from "../types/filter.types"

/**
 * Regla estándar de filtros de lista (Jira/Linear-style):
 * OR entre chips del MISMO campo, AND entre campos DISTINTOS.
 * Ej: "Prioridad: Alta" + "Prioridad: Media" + "Estado: En cola"
 *   → (Prioridad = Alta OR Media) AND (Estado = En cola)
 *
 * Antes se hacía `filters.every(...)` sobre todos los chips sin
 * agrupar — dos chips del mismo campo exigían que el item cumpla
 * ambos a la vez, imposible para un campo de valor único (ej.
 * prioridad), y la lista quedaba vacía apenas agregabas un segundo
 * chip del mismo campo.
 *
 * `matches(chip)` solo decide si UN item cumple UN chip puntual
 * (la lógica por-entidad de cada selector); esta función se encarga
 * exclusivamente del agrupamiento AND/OR, para no repetirlo en cada
 * selector (tasks/projects/process).
 */
export function matchesGroupedFilters(
  filters: FilterChip[],
  matches: (filter: FilterChip) => boolean,
): boolean {

  if (filters.length === 0) {
    return true
  }

  const byField = new Map<string, FilterChip[]>()

  for (const chip of filters) {
    const group = byField.get(chip.field)
    if (group) {
      group.push(chip)
    } else {
      byField.set(chip.field, [chip])
    }
  }

  for (const group of byField.values()) {
    if (!group.some(matches)) {
      return false
    }
  }

  return true

}
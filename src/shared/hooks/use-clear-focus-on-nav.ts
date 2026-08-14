"use client"

/**
 * Antes: al cambiar pathname se borraban taskId/projectId/focus.
 * Eso consumía el deep-link en el mismo tick en que llegabas a la
 * página destino (mensajes → /tasks?taskId=…) y el row se colapsaba.
 *
 * Consumo correcto (una sola política):
 * - Usuario abre otro row / colapsa → useExpandRow
 * - F5 con params → se re-aplica el foco (URL es la fuente)
 *
 * Este hook queda como no-op documentado por si el shell aún lo monta.
 * No toca la URL.
 */
export function useClearFocusOnNav() {
  // intencionalmente vacío
}

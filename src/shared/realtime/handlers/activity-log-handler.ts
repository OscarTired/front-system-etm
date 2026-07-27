import { getQueryClient } from "@/lib/query-client"

import type { RealtimeEvent } from "../types/realtime-event"

// A diferencia de otras entidades, Activity Log se consulta mediante
// múltiples variantes de queryKey (equipo, personal, fechas, filtros,
// etc.) y el payload realtime no contiene suficiente contexto para
// determinar con seguridad qué caches incluyen el registro afectado.
//
// En lugar de intentar mantener manualmente todas esas combinaciones,
// invalidamos cualquier query cuyo prefijo sea ["activity-log"].
// React Query marcará esas queries como stale y únicamente volverá a
// obtener las que tengan observadores activos, evitando lógica
// específica por vista y reduciendo el riesgo de inconsistencias.
export function activityLogHandler(
  _event: RealtimeEvent,
) {
  const queryClient = getQueryClient()

  queryClient.invalidateQueries({
    queryKey: ["activity-log"],
  })
}
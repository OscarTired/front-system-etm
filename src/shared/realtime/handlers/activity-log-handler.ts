import { getQueryClient } from "@/lib/query-client"

import type { RealtimeEvent } from "../types/realtime-event"

// A diferencia de comment-handler/priority-handler, acá NO hacemos
// setQueryData quirúrgico. Las queries de bitácora tienen demasiadas
// variantes de key (["activity-log","me","today", department, date]
// para cada combinación de depto/fecha, y ["activity-log","team",
// filters] con un filtro por-usuario/rango arbitrario) como para
// mantener un resolveQueryKey que las cubra todas sin errores. El
// payload tampoco nos da suficiente (¿"today" en qué timezone?, ¿el
// registro cae dentro del `from`/`to` de CADA vista de equipo
// abierta?) para decidir a mano en cuál variante insertar/actualizar
// la entrada.
//
// Así que en vez de intentar adivinar, invalidamos TODO lo que
// empiece con el prefijo "activity-log" — cubre "me/today" (hoy y
// cualquier fecha pasada que se esté mirando) y "team" (cualquier
// combinación de filtros) de una sola pasada, para CUALQUIER acción
// (CREATED/UPDATED/DELETED). React Query se encarga de refetchear
// solo las que estén activas (mounted) en este momento.
export function activityLogHandler(
  _event: RealtimeEvent,
) {

  const queryClient = getQueryClient()

  queryClient.invalidateQueries({ queryKey: ["activity-log"] })

}
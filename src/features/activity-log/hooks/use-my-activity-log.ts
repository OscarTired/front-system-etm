"use client"

import { useQuery } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"

// `date` en formato YYYY-MM-DD (ver toISODateString). Sin `date`,
// el key queda igual que antes (null) — sigue siendo "hoy", así
// que la caché de las mutaciones (crear/borrar/mover, que solo se
// habilitan cuando se está viendo el día de hoy) sigue apuntando
// al mismo lugar sin tener que pasarles `date` a ellas también.
export const myActivityLogQueryKey = (
  department?: ActivityDepartment,
  date?: string,
) =>
  ["activity-log", "me", "today", department ?? null, date ?? null] as const

export function useMyActivityLog(department?: ActivityDepartment, date?: string) {

  const { data, isLoading } = useQuery({
    queryKey: myActivityLogQueryKey(department, date),
    queryFn: ({ signal }) => activityLogService.getMyToday(department, date, signal),
  })

  return {
    logs: data ?? [],
    loading: isLoading,
  }

}
"use client"

import { useQuery } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"

export const activityTypesQueryKey = (includeInactive: boolean, department?: ActivityDepartment) =>
  ["activity-types", { includeInactive, department }] as const

export function useActivityTypes(includeInactive = false, department?: ActivityDepartment) {

  const { data, isLoading } = useQuery({
    queryKey: activityTypesQueryKey(includeInactive, department),
    queryFn: ({ signal }) => activityLogService.getTypes(includeInactive, department, signal),
    // Es una lista chica que casi no cambia — no hace falta
    // refrescarla todo el tiempo, el que la edite (admin) va a
    // notarlo la próxima vez que alguien la abra igual.
    staleTime: 1000 * 60 * 10,
  })

  return {
    types: data ?? [],
    loading: isLoading,
  }

}
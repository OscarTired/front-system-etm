"use client"

import { useQuery } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"

export type TeamActivityLogFilters = {
  userId?: string
  from?: string
  to?: string
  department?: ActivityDepartment
}

export function useTeamActivityLog(filters: TeamActivityLogFilters) {

  const { data, isLoading } = useQuery({
    queryKey: ["activity-log", "team", filters],
    queryFn: ({ signal }) => activityLogService.getAll(filters, signal),
  })

  return {
    logs: data ?? [],
    loading: isLoading,
  }

}
"use client"

import { useQuery } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"

export const myActivityLogQueryKey = (department?: ActivityDepartment) =>
  ["activity-log", "me", "today", department ?? null] as const

export function useMyActivityLog(department?: ActivityDepartment) {

  const { data, isLoading } = useQuery({
    queryKey: myActivityLogQueryKey(department),
    queryFn: ({ signal }) => activityLogService.getMyToday(department, signal),
  })

  return {
    logs: data ?? [],
    loading: isLoading,
  }

}
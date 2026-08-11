"use client"

import { useQuery } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"

export function useMyActivityLogRange(
  department: ActivityDepartment | undefined,
  fromISO: string,
  toISO: string,
  _userId?: string,
) {
  const enabled = Boolean(fromISO && toISO)

  const { data, isLoading } = useQuery({
    queryKey: [
      "activity-log",
      "me",
      "range",
      department ?? null,
      fromISO,
      toISO,
    ],
    enabled,
    queryFn: ({ signal }) =>
      activityLogService.getMyRange(
        {
          from: fromISO,
          to: toISO,
          department,
        },
        signal,
      ),
  })

  return {
    logs: data ?? [],
    loading: isLoading,
  }
}
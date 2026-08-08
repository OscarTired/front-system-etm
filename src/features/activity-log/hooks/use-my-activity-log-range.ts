"use client"

import { useQuery } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"
import { endOfDayISO, startOfDayISO } from "../utils/week-range"

export function useMyActivityLogRange(
  department: ActivityDepartment | undefined,
  fromISO: string,
  toISO: string,
  userId?: string,
) {
  const enabled = Boolean(fromISO && toISO && userId)

  const { data, isLoading } = useQuery({
    queryKey: [
      "activity-log",
      "me",
      "range",
      department ?? null,
      fromISO,
      toISO,
      userId,
    ],
    enabled,
    queryFn: ({ signal }) =>
      activityLogService.getAll(
        {
          userId,
          department,
          from: startOfDayISO(fromISO),
          to: endOfDayISO(toISO),
        },
        signal,
      ),
  })

  return {
    logs: data ?? [],
    loading: isLoading,
  }
}
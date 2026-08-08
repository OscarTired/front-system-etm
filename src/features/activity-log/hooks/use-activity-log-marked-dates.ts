"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { activityLogService } from "../services/activity-log.service"
import type { ActivityDepartment } from "../types/activity-log.types"
import type { DayMarker } from "@/shared/ui/date-picker/types/types"

const MARKER_COLOR = "#22d3ee"

type Scope =
  | { scope: "me"; department?: ActivityDepartment }
  | { scope: "team"; userId?: string; department?: ActivityDepartment }

type Options = Scope & {
  /** Cualquier día del mes visible en el calendario */
  month: Date
}

function monthBoundsISO(month: Date) {
  const y = month.getFullYear()
  const m = month.getMonth()
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`
  const lastDay = new Date(y, m + 1, 0).getDate()
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { from, to }
}

/**
 * markedDates solo desde el backend:
 * - scope "me"   → GET /activity-log/me/marked-dates  (user del token)
 * - scope "team" → GET /activity-log/marked-dates     (READ_ANY)
 */
export function useActivityLogMarkedDates(options: Options) {
  const { month } = options
  const { from, to } = useMemo(() => monthBoundsISO(month), [month])

  const queryKey =
    options.scope === "me"
      ? (["activity-log", "me", "marked-dates", options.department ?? null, from, to] as const)
      : ([
          "activity-log",
          "team",
          "marked-dates",
          options.userId ?? null,
          options.department ?? null,
          from,
          to,
        ] as const)

  const { data: dates = [] } = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      if (options.scope === "me") {
        return activityLogService.getMyMarkedDates(
          { from, to, department: options.department },
          signal,
        )
      }
      return activityLogService.getMarkedDates(
        {
          from,
          to,
          userId: options.userId,
          department: options.department,
        },
        signal,
      )
    },
    staleTime: 60_000,
  })

  const markedDates = useMemo(() => {
    const map: Record<string, DayMarker[]> = {}
    for (const key of dates) {
      map[key] = [{ color: MARKER_COLOR }]
    }
    return map
  }, [dates])

  return { markedDates }
}
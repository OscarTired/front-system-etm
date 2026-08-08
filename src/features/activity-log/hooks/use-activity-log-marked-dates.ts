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
  /** Mes visible en el calendario (o el del día seleccionado) */
  month: Date
  /** Si false, no llama al backend */
  enabled?: boolean
}

/** from = 1er día del mes anterior, to = último del mes siguiente (celdas del grid) */
function expandedMonthBoundsISO(month: Date) {
  const y = month.getFullYear()
  const m = month.getMonth()

  const prev = new Date(y, m - 1, 1)
  const next = new Date(y, m + 1, 1)
  const nextLast = new Date(y, m + 2, 0).getDate()

  const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`
  const to = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(nextLast).padStart(2, "0")}`
  return { from, to }
}

/**
 * markedDates solo desde el backend:
 * - scope "me"   → GET /activity-log/me/marked-dates
 * - scope "team" → GET /activity-log/marked-dates
 *
 * Rango = mes visible ± 1 (cubre días grises del grid).
 */
export function useActivityLogMarkedDates(options: Options) {
  const { month, enabled = true } = options
  const { from, to } = useMemo(() => expandedMonthBoundsISO(month), [month])

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
    enabled,
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
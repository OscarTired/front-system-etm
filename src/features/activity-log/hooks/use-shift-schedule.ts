"use client"

import { useEffect, useMemo, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { activityLogService } from "../services/activity-log.service"
import type { DayShift } from "../types/activity-log.types"
import type { ShiftSchedule, SlotState } from "../types/shift-schedule.types"

export const shiftScheduleQueryKey = (date?: string) =>
  ["activity-log", "shifts", date ?? "today"] as const

/**
 * Schedule de franjas desde el backend (Lima).
 *
 * - Fuente de verdad: GET /activity-log/shifts
 * - Auto-refresh: al llegar `nextBoundaryAt` (timeout), no interval ciego
 * - Al volver el tab visible: invalidate inmediato
 */
export function useShiftSchedule(date?: string) {
  const queryClient = useQueryClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useQuery({
    queryKey: shiftScheduleQueryKey(date),
    queryFn: ({ signal }) => activityLogService.getShiftSchedule(date, signal),
    // El server manda nextBoundaryAt; no usamos refetchInterval fijo.
    staleTime: 15_000,
  })

  const schedule = query.data

  // Agenda refetch exacto al próximo boundary del server.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const boundary = schedule?.nextBoundaryAt
    if (!boundary || !schedule?.isToday) return

    const delay = new Date(boundary).getTime() - Date.now()
    // Holgura 500ms por latencia; si ya pasó, refetch ya.
    const ms = Math.max(delay + 500, 250)

    timerRef.current = setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: shiftScheduleQueryKey(date),
      })
    }, ms)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [schedule?.nextBoundaryAt, schedule?.isToday, date, queryClient])

  // Tab visible de nuevo → revalidar (reloj pudo cruzar boundary offline).
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return
      void queryClient.invalidateQueries({
        queryKey: shiftScheduleQueryKey(date),
      })
    }

    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [date, queryClient])

  const stateByShift = useMemo(() => {
    const map = new Map<DayShift, SlotState>()
    for (const slot of schedule?.slots ?? []) {
      map.set(slot.shift, slot.state)
    }
    return map
  }, [schedule?.slots])

  const openByShift = useMemo(() => {
    const map = new Map<DayShift, boolean>()
    for (const slot of schedule?.slots ?? []) {
      map.set(slot.shift, slot.open)
    }
    return map
  }, [schedule?.slots])

  function getState(shift: DayShift): SlotState {
    return stateByShift.get(shift) ?? "upcoming"
  }

  function isOpen(shift: DayShift): boolean {
    return openByShift.get(shift) ?? false
  }

  return {
    schedule: schedule as ShiftSchedule | undefined,
    loading: query.isLoading,
    getState,
    isOpen,
    currentShift: schedule?.currentShift ?? null,
    serverNow: schedule?.serverNow,
  }
}

"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import { myActivityLogQueryKey } from "./use-my-activity-log"
import type { ActivityDepartment, ActivityLog, DayShift } from "../types/activity-log.types"

// Calco de useDeleteActivityLog: mismo query key, mismo patrón de
// optimistic update + rollback. Acá en vez de sacar la entrada de la
// caché, se le pisa el `shift` para que la tarjeta salte de franja
// al instante mientras el PATCH resuelve en el fondo.
export function useMoveActivityLog(department?: ActivityDepartment) {

  const queryClient = useQueryClient()

  const queryKey = myActivityLogQueryKey(department)

  const mutation = useMutation({

    mutationFn: ({ id, shift }: { id: string; shift: DayShift }) =>
      activityLogService.updateShift(id, shift),

    onMutate: async ({ id, shift }) => {

      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<ActivityLog[]>(queryKey) ?? []

      queryClient.setQueryData<ActivityLog[]>(
        queryKey,
        previous.map((log) => (log.id === id ? { ...log, shift } : log)),
      )

      return { previous }

    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },

  })

  return {
    moveLog: mutation.mutateAsync,
    moving: mutation.isPending,
  }

}
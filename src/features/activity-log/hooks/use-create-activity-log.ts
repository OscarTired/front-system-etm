"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import { myActivityLogQueryKey } from "./use-my-activity-log"
import { getCurrentShift } from "../constants/shift-definitions"
import type { ActivityDepartment, ActivityLog, ActivityType, CreateActivityLogDto } from "../types/activity-log.types"

export function useCreateActivityLog(types: ActivityType[], department?: ActivityDepartment) {

  const queryClient = useQueryClient()

  const queryKey = myActivityLogQueryKey(department)

  const mutation = useMutation({

    mutationFn: (dto: CreateActivityLogDto) => activityLogService.create(dto),

    onMutate: async (dto) => {

      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<ActivityLog[]>(queryKey) ?? []

      const activityType = types.find(t => t.id === dto.activityTypeId)

      if (activityType) {

        const optimisticLog: ActivityLog = {
          id: `optimistic-${Date.now()}`,
          userId: "",
          activityTypeId: dto.activityTypeId,
          projectId: dto.projectId ?? null,
          taskId: dto.taskId ?? null,
          note: dto.note ?? null,
          // El data URI ya sirve como preview directa — no hace
          // falta esperar la URL real de Supabase para mostrarla.
          photoUrl: dto.photoBase64 ?? null,
          shift: getCurrentShift(new Date()),
          source: "MANUAL",
          loggedAt: new Date().toISOString(),
          activityType,
          // El preview optimista no tiene los datos completos de
          // proyecto/tarea todavía (solo el id) — aparecen recién
          // cuando el servidor confirma y se invalida la query.
          project: null,
          task: null,
        }

        queryClient.setQueryData<ActivityLog[]>(
          queryKey,
          [...previous, optimisticLog],
        )

      }

      return { previous }

    },

    onError: (_err, _dto, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },

  })

  return {
    createLog: mutation.mutateAsync,
    creating: mutation.isPending,
  }

}
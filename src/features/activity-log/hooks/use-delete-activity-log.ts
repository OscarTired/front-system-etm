"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { activityLogService } from "../services/activity-log.service"
import { myActivityLogQueryKey } from "./use-my-activity-log"
import type { ActivityDepartment, ActivityLog } from "../types/activity-log.types"

export function useDeleteActivityLog(department?: ActivityDepartment) {

  const queryClient = useQueryClient()

  const queryKey = myActivityLogQueryKey(department)

  const mutation = useMutation({

    mutationFn: (id: string) => activityLogService.remove(id),

    onMutate: async (id) => {

      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<ActivityLog[]>(queryKey) ?? []

      queryClient.setQueryData<ActivityLog[]>(
        queryKey,
        previous.filter((log) => log.id !== id),
      )

      return { previous }

    },

    onError: (_err, _id, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },

  })

  return {
    deleteLog: mutation.mutateAsync,
    deleting: mutation.isPending,
  }

}
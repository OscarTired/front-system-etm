"use client"

import { useQuery } from "@tanstack/react-query"

import { useAuthStore } from "@/features/auth/store/auth-store"
import { commentsService } from "../services/comments.service"
import type { Comment } from "../types/comment.types"
import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { WorkflowStatusValue } from "@/features/notifications/types/notification.types"

export type MyCommentRoute = {
  module: "tasks" | "processes" | "projects"
  history: boolean
  processCode?: ProcessCode | string
}

export type MyCommentItem = Comment & {
  task?: {
    id: string
    reference: string
    taskNumber: number
    project: {
      id?: string
      projectCode: string
      name: string
    }
  } | null
  project?: {
    id: string
    projectCode: string
    name: string
  } | null
  workflowStep?: {
    id: string
    processCode: string
    status: WorkflowStatusValue
  } | null
  route?: MyCommentRoute
}

export const myCommentsQueryKey = ["comments", "mine"] as const

/**
 * Comentarios creados por el usuario autenticado (centro Mensajes).
 * Backend devuelve contexto + route (igual criterio que notificaciones).
 */
export function useMyComments(enabled = true) {
  const userId = useAuthStore(s => s.user?.id)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: myCommentsQueryKey,
    enabled: enabled && Boolean(userId),
    queryFn: ({ signal }) =>
      commentsService.getMyComments(signal) as Promise<MyCommentItem[]>,
    select: rows => {
      if (!userId) return []
      return rows.filter(c => c.userId === userId)
    },
  })

  return {
    comments: (data ?? []) as MyCommentItem[],
    loading: isLoading,
    error: isError ? error : null,
    refetch,
  }
}

import type { Comment } from "@/features/comments/types/comment.types"
import { myCommentsQueryKey } from "@/features/comments/hooks/use-my-comments"
import { useAuthStore } from "@/features/auth/store/auth-store"

import { getQueryClient } from "@/lib/query-client"

import type { RealtimeEvent } from "../types/realtime-event"

type CommentLocation = {
  taskId: string | null
  workflowStepId: string | null
  projectId: string | null
}

function resolveQueryKey(location: CommentLocation) {
  if (location.workflowStepId) {
    return ["comments", "workflowStep", location.workflowStepId] as const
  }

  if (location.projectId) {
    return ["comments", "project", location.projectId] as const
  }

  return ["comments", "task", location.taskId] as const
}

/**
 * "Mensajes" es una vista enriquecida (route, task, project).
 * El payload realtime del hilo no trae ese shape → invalidar, no setQueryData.
 */
function invalidateMyCommentsIfRelevant(
  authorId: string | undefined | null,
) {
  const me = useAuthStore.getState().user?.id
  if (!me) return

  // Sin autor (p.ej. DELETE mínimo): invalidar por si era mío.
  if (!authorId || authorId === me) {
    getQueryClient().invalidateQueries({ queryKey: myCommentsQueryKey })
  }
}

export function commentHandler(
  event: RealtimeEvent,
) {
  const queryClient = getQueryClient()

  switch (event.action) {
    case "CREATED": {
      const comment = event.payload as Comment
      const queryKey = resolveQueryKey(comment)

      queryClient.setQueryData<Comment[]>(
        queryKey,
        current => {
          if ((current ?? []).some(c => c.id === comment.id)) {
            return current
          }
          return [comment, ...(current ?? [])]
        },
      )

      invalidateMyCommentsIfRelevant(
        comment.userId ?? comment.user?.id,
      )
      return
    }

    case "UPDATED": {
      const comment = event.payload as Comment
      const queryKey = resolveQueryKey(comment)

      queryClient.setQueryData<Comment[]>(
        queryKey,
        current =>
          (current ?? []).map(c => {
            if (c.id === comment.id) {
              return comment
            }

            if (c.parent?.id === comment.id) {
              return {
                ...c,
                parent: {
                  id: comment.id,
                  message: comment.message,
                  deletedAt: null,
                  user: {
                    id: comment.user.id,
                    name: comment.user.name,
                  },
                },
              }
            }

            return c
          }),
      )

      invalidateMyCommentsIfRelevant(
        comment.userId ?? comment.user?.id,
      )
      return
    }

    case "DELETED": {
      const payload = event.payload as
        | (CommentLocation & {
            id: string
            userId?: string
            user?: { id: string }
          })
        | undefined

      if (!payload) {
        return
      }

      const queryKey = resolveQueryKey(payload)

      queryClient.setQueryData<Comment[]>(
        queryKey,
        current =>
          (current ?? [])
            .filter(c => c.id !== payload.id)
            .map(c =>
              c.parent?.id === payload.id
                ? {
                    ...c,
                    parent: {
                      ...c.parent,
                      deletedAt: new Date().toISOString(),
                    },
                  }
                : c,
            ),
      )

      invalidateMyCommentsIfRelevant(
        payload.userId ?? payload.user?.id,
      )
      return
    }
  }
}

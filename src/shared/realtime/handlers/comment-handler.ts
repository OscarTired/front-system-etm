import type { Comment } from "@/features/comments/types/comment.types"
import { myCommentsQueryKey } from "@/features/comments/hooks/use-my-comments"
import { useAuthStore } from "@/features/auth/store/auth-store"
import type { Task } from "@/features/tasks/types/task.types"
import type { Project } from "@/features/projects/types/project.types"

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

/**
 * Burbujas de lista (project/task/step.commentCount) leen el cache de
 * entidades, no el hilo de comentarios. Parche barato en memoria.
 */
function bumpEntityCommentCounts(
  location: CommentLocation,
  delta: 1 | -1,
) {
  const queryClient = getQueryClient()

  if (location.projectId) {
    const projectId = location.projectId
    queryClient.setQueryData<Project[]>(["projects"], current =>
      (current ?? []).map(p =>
        p.id === projectId
          ? {
              ...p,
              commentCount: Math.max(0, (p.commentCount ?? 0) + delta),
            }
          : p,
      ),
    )
    queryClient.setQueryData<Project>(["project", projectId], current =>
      current
        ? {
            ...current,
            commentCount: Math.max(0, (current.commentCount ?? 0) + delta),
          }
        : current,
    )
  }

  if (location.taskId || location.workflowStepId) {
    const taskId = location.taskId
    const stepId = location.workflowStepId

    queryClient.setQueryData<Task[]>(["tasks"], current =>
      (current ?? []).map(task => {
        if (taskId && task.id === taskId) {
          const next: Task = {
            ...task,
            commentCount: Math.max(0, (task.commentCount ?? 0) + delta),
          }
          if (stepId && task.workflowSteps?.length) {
            next.workflowSteps = task.workflowSteps.map(step =>
              step.id === stepId
                ? {
                    ...step,
                    commentCount: Math.max(
                      0,
                      (step.commentCount ?? 0) + delta,
                    ),
                  }
                : step,
            )
          }
          return next
        }

        // Comentario solo de step: localizar la tarea que lo contiene
        if (!taskId && stepId && task.workflowSteps?.some(s => s.id === stepId)) {
          return {
            ...task,
            workflowSteps: task.workflowSteps.map(step =>
              step.id === stepId
                ? {
                    ...step,
                    commentCount: Math.max(
                      0,
                      (step.commentCount ?? 0) + delta,
                    ),
                  }
                : step,
            ),
          }
        }

        return task
      }),
    )
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

      let inserted = false
      queryClient.setQueryData<Comment[]>(
        queryKey,
        current => {
          if ((current ?? []).some(c => c.id === comment.id)) {
            return current
          }
          inserted = true
          return [comment, ...(current ?? [])]
        },
      )

      if (inserted) {
        bumpEntityCommentCounts(comment, 1)
      }

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

      let removed = false
      queryClient.setQueryData<Comment[]>(
        queryKey,
        current => {
          const list = current ?? []
          if (!list.some(c => c.id === payload.id)) {
            return current
          }
          removed = true
          return list
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
            )
        },
      )

      if (removed) {
        bumpEntityCommentCounts(payload, -1)
      }

      invalidateMyCommentsIfRelevant(
        payload.userId ?? payload.user?.id,
      )
      return
    }
  }
}

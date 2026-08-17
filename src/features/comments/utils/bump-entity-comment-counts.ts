import type { QueryClient } from "@tanstack/react-query"

import type { Comment } from "@/features/comments/types/comment.types"
import type { Project } from "@/features/projects/types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

export type CommentLocation = {
  taskId: string | null
  workflowStepId: string | null
  projectId: string | null
}

/**
 * Burbujas de lista (project/task/step.commentCount) leen el cache de
 * entidades, no el hilo de comentarios. Parche en memoria inmediato.
 */
export function bumpEntityCommentCounts(
  queryClient: QueryClient,
  location: CommentLocation,
  delta: 1 | -1,
) {
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

        if (
          !taskId &&
          stepId &&
          task.workflowSteps?.some(s => s.id === stepId)
        ) {
          return {
            ...task,
            workflowSteps: task.workflowSteps!.map(step =>
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

export function locationFromComment(
  comment: Pick<Comment, "taskId" | "workflowStepId" | "projectId">,
): CommentLocation {
  return {
    taskId: comment.taskId ?? null,
    workflowStepId: comment.workflowStepId ?? null,
    projectId: comment.projectId ?? null,
  }
}

export function locationFromTarget(target: {
  scope: string
  taskId?: string
  projectId?: string
  workflowStepId?: string
}): CommentLocation {
  return {
    taskId: target.scope === "task" ? (target.taskId ?? null) : null,
    workflowStepId:
      target.scope === "workflowStep"
        ? (target.workflowStepId ?? null)
        : null,
    projectId: target.scope === "project" ? (target.projectId ?? null) : null,
  }
}

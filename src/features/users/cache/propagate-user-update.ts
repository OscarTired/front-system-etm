import type { QueryClient } from "@tanstack/react-query"

import type { User } from "../types/user.types"
import type { Project } from "@/features/projects/types/project.types"
import type { Task } from "@/features/tasks/types/task.types"
import type { EngineeringTask } from "@/features/engineering/types/engineering-task.types"
import type { WorkflowStep } from "@/features/workflow/types/workflow.types"

/** Campos de presentación que la UI pinta desde snapshots anidados. */
function ink(user: User) {
  return {
    id: user.id,
    name: user.name,
    color: user.color,
    icon: user.icon,
    username: user.username,
  }
}

function patchNestedUser<T extends { id: string }>(
  current: T | null | undefined,
  user: User,
): T | null | undefined {
  if (!current || current.id !== user.id) return current
  return { ...current, ...ink(user) } as T
}

function patchStep(step: WorkflowStep, user: User): WorkflowStep {
  if (step.operator?.id !== user.id && step.operatorId !== user.id) {
    return step
  }
  return {
    ...step,
    operatorId: step.operatorId,
    operator: step.operator
      ? { ...step.operator, ...ink(user) }
      : step.operator,
  }
}

/**
 * Usuario editado (nombre/color/icono): propaga a copias denormalizadas.
 * No toca historial/logs ni fuerza onChange de selects.
 */
export function propagateUserUpdate(
  queryClient: QueryClient,
  user: User,
) {
  const patch = ink(user)

  // Catálogo / directory
  queryClient.setQueryData<User>(["user", user.id], prev =>
    prev ? { ...prev, ...user } : user,
  )

  for (const key of [["users"], ["users", "directory"]] as const) {
    queryClient.setQueryData<User[]>([...key], current =>
      (current ?? []).map(u => (u.id === user.id ? { ...u, ...user } : u)),
    )
  }

  // También cualquier query que empiece con "users"
  for (const [key, data] of queryClient.getQueriesData<User[]>({
    queryKey: ["users"],
  })) {
    if (!Array.isArray(data)) continue
    queryClient.setQueryData<User[]>(key, data.map(u =>
      u.id === user.id ? { ...u, ...user } : u,
    ))
  }

  // Projects: pm + audit
  queryClient.setQueryData<Project[]>(["projects"], current =>
    (current ?? []).map(project => {
      let next = project
      if (project.pm?.id === user.id) {
        next = { ...next, pm: { ...project.pm, ...patch } as Project["pm"] }
      }
      if (project.createdBy?.id === user.id) {
        next = {
          ...next,
          createdBy: { ...project.createdBy, ...patch },
        }
      }
      if (project.updatedBy?.id === user.id) {
        next = {
          ...next,
          updatedBy: { ...project.updatedBy, ...patch },
        }
      }
      return next
    }),
  )

  for (const [key, project] of queryClient.getQueriesData<Project>({
    queryKey: ["project"],
  })) {
    if (!project) continue
    let next = project
    if (project.pm?.id === user.id) {
      next = { ...next, pm: { ...project.pm, ...patch } as Project["pm"] }
    }
    if (next !== project) {
      queryClient.setQueryData<Project>(key, next)
    }
  }

  // Tasks: project.pm, operator en steps, audit
  queryClient.setQueryData<Task[]>(["tasks"], current =>
    (current ?? []).map(task => {
      let next = task

      if (task.project?.pm?.id === user.id) {
        next = {
          ...next,
          project: {
            ...task.project,
            pm: { ...task.project.pm, ...patch } as Task["project"]["pm"],
          },
        }
      }

      if (task.createdBy?.id === user.id) {
        next = {
          ...next,
          createdBy: { ...task.createdBy, ...patch },
        }
      }
      if (task.updatedBy?.id === user.id) {
        next = {
          ...next,
          updatedBy: { ...task.updatedBy, ...patch },
        }
      }

      if (task.workflowSteps?.some(
        s => s.operator?.id === user.id || s.operatorId === user.id,
      )) {
        next = {
          ...next,
          workflowSteps: task.workflowSteps.map(s => patchStep(s, user)),
        }
      }

      return next
    }),
  )

  // Engineering tasks: assignee
  for (const [key, data] of queryClient.getQueriesData<EngineeringTask[]>({
    queryKey: ["engineering-tasks"],
  })) {
    if (!Array.isArray(data)) continue
    queryClient.setQueryData<EngineeringTask[]>(key, data.map(task => {
      if (task.assignee?.id !== user.id && task.assigneeId !== user.id) {
        return task
      }
      return {
        ...task,
        assignee: task.assignee
          ? {
              ...task.assignee,
              name: user.name,
              color: user.color,
              icon: user.icon,
            }
          : task.assignee,
      }
    }))
  }
}

"use client"

import type { QueryClient } from "@tanstack/react-query"

import type { Task } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"
import type { WorkflowStep } from "../types/workflow.types"

import type { WorkflowResponse } from "../services/workflow.services"

function mergeSteps(
  currentSteps: WorkflowStep[],
  updated: Partial<WorkflowStep>[],
): WorkflowStep[] {

  return currentSteps.map(step => {

    const patch = updated.find(u => u.id === step.id)

    return patch
      ? { ...step, ...patch }
      : step

  })

}

// El patch que manda el backend para "Convocar" (y cualquier otro
// PATCH del workflow que solo toque operatorId) nunca incluye el
// objeto `operator` completo — sería redundante mandar el User
// entero por cada cambio de estado. El problema es que algunas
// pantallas (ProcessMobileCard/ProcessOperatorCell) leen
// step.operator (el objeto anidado) para mostrar el nombre, en vez
// de resolverlo por separado a partir de operatorId como sí hace el
// Kanban — así que un merge superficial ({...step, ...patch}) dejaba
// operatorId actualizado pero operator con el valor viejo (null si
// antes no había nadie asignado). Esto resuelve el objeto completo
// desde el directorio de usuarios (ya cacheado, no pega a la red de
// nuevo) antes de mergear, para que las dos formas de leerlo queden
// consistentes.
function resolveOperators(
  queryClient: QueryClient,
  updated: Partial<WorkflowStep>[],
): Partial<WorkflowStep>[] {

  const hasOperatorIdChange = updated.some(
    patch => "operatorId" in patch,
  )

  if (!hasOperatorIdChange) {
    return updated
  }

  const directory =
    queryClient.getQueryData<User[]>(["users", "directory"]) ?? []

  return updated.map(patch => {

    if (!("operatorId" in patch)) {
      return patch
    }

    const operator =
      patch.operatorId
        ? directory.find(user => user.id === patch.operatorId) ?? null
        : null

    return { ...patch, operator }

  })

}

export function propagateWorkflowUpdate(
  queryClient: QueryClient,
  response: WorkflowResponse,
) {

  const { taskId, updated: rawUpdated } = response

  if (!rawUpdated || rawUpdated.length === 0) {
    return
  }

  const updated = resolveOperators(queryClient, rawUpdated)

  queryClient.setQueryData<Task[]>(

    ["tasks"],

    current => {

      if (!current) return current

      return current.map(task =>

        task.id === taskId

          ? {
              ...task,
              workflowSteps: mergeSteps(
                task.workflowSteps,
                updated,
              ),
            }

          : task,

      )

    },

  )

  const cachedTask = queryClient.getQueryData<Task>(
    ["task", taskId],
  )

  if (cachedTask) {

    queryClient.setQueryData<Task>(

      ["task", taskId],

      {
        ...cachedTask,
        workflowSteps: mergeSteps(
          cachedTask.workflowSteps,
          updated,
        ),
      },

    )

  }

}
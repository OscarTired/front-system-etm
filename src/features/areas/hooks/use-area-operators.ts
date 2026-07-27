"use client"

import { useMemo } from "react"

import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { useTasks } from "@/features/tasks/hooks/use-tasks"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

export type OperatorAvailability =
  | { state: "FREE" }
  | { state: "WORKING"; taskLabel: string }
  | { state: "PAUSED"; taskLabel: string }
  | { state: "INVITED"; taskLabel: string }

export type AreaOperator = {
  user: User
  availability: OperatorAvailability
}

function taskLabel(task: { taskNumber: number; reference: string }) {
  return `#${String(task.taskNumber).padStart(3, "0")} ${task.reference}`
}

// Operarios de un área con su disponibilidad REAL — a propósito no
// oculta a los ocupados (a diferencia de ProcessOperatorCell, que sí
// los filtra afuera): acá el supervisor tiene que poder convocar a
// cualquiera igual, y ver el estado es justo lo que le permite
// decidir. 100% derivado de datos que ya están en caché
// (useTasks/useUsersDirectory) — no pega un endpoint nuevo para
// esto.
export function useAreaOperators(processCode: ProcessCode | null) {

  const { users } = useUsersDirectory()
  const { tasks } = useTasks()

  return useMemo<AreaOperator[]>(() => {

    if (!processCode) {
      return []
    }

    const candidates = (users as User[]).filter(
      user =>
        user.roles?.some(role => role.code === "PRODUCCION") &&
        user.level === "OPERARIO" &&
        // Antes era user.area?.processCode === processCode (1 a 1)
        // — ahora un operario puede estar en varias áreas, así que
        // basta con que UNA de ellas matchee esta.
        user.areas?.some(area => area.processCode === processCode),
    )

    return candidates.map(user => {

      for (const task of tasks) {

        for (const step of task.workflowSteps) {

          if (step.invitedOperatorId === user.id) {
            return {
              user,
              availability: { state: "INVITED" as const, taskLabel: taskLabel(task) },
            }
          }

          if (
            step.operatorId === user.id &&
            (step.status === "PROGRESS" || step.status === "PAUSED")
          ) {
            return {
              user,
              availability: {
                state: step.status === "PROGRESS" ? ("WORKING" as const) : ("PAUSED" as const),
                taskLabel: taskLabel(task),
              },
            }
          }

        }

      }

      return { user, availability: { state: "FREE" as const } }

    })

  }, [users, tasks, processCode])

}
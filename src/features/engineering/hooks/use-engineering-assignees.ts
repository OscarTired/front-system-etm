"use client"

import { useMemo } from "react"

import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"
import type { ConvocarOption } from "@/shared/ui/convocar-menu/convocar-menu"

import { useEngineeringTasks } from "./use-engineering-tasks"
import { isEngineeringUser } from "../utils/is-engineering-user"
import type { EngineeringTask } from "../types/engineering-task.types"

const STATUS_COLOR = {
  FREE: "#10B981",
  WORKING: "#F59E0B",
  PENDING: "#2563EB",
  QUEUE: "#64748B",
} as const

function engTaskLabel(task: EngineeringTask) {
  const num = String(task.taskNumber).padStart(2, "0")
  return `${num} ${task.title}`
}

/**
 * Ingenieros convocables con disponibilidad derivada de tareas activas.
 * Mismo espíritu que useAreaOperators (planta).
 */
export function useEngineeringAssignees(): ConvocarOption[] {
  const { users } = useUsersDirectory()
  const { tasks } = useEngineeringTasks()

  return useMemo(() => {
    const candidates = (users as User[]).filter(isEngineeringUser)

    return candidates.map(user => {
      // Primera tarea activa asignada (no COMPLETED)
      const active = tasks.find(
        t =>
          t.assigneeId === user.id &&
          t.status !== "COMPLETED",
      )

      if (!active) {
        return {
          user,
          description: "Libre",
          descriptionColor: STATUS_COLOR.FREE,
        }
      }

      if (active.status === "PROGRESS") {
        return {
          user,
          description: `Trabajando · ${engTaskLabel(active)}`,
          descriptionColor: STATUS_COLOR.WORKING,
        }
      }

      if (active.status === "PENDING") {
        return {
          user,
          description: `Pendiente · ${engTaskLabel(active)}`,
          descriptionColor: STATUS_COLOR.PENDING,
        }
      }

      // QUEUE
      return {
        user,
        description: `En cola · ${engTaskLabel(active)}`,
        descriptionColor: STATUS_COLOR.QUEUE,
      }
    })
  }, [users, tasks])
}

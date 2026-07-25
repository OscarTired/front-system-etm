"use client"

import { useMemo } from "react"

import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { getTaskProcesses } from "@/features/tasks/pipeline/utils/get-task-process"
import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import { useMyAreaTasks } from "./use-my-area-tasks"

// Mismo criterio de "pendiente" que usa TaskAreaPanel (showHistory
// en false por default: se cuentan las tareas cuyo workflow NO está
// 100% REVIEWED), y el mismo cálculo de "pertenece a mi área" vía
// getTaskProcesses — ver TaskAreaPanel.columns. Vive en un hook
// aparte para que el trigger (botón "Mis tareas") pueda mostrar el
// contador sin tener montado el panel completo.
export function useMyAreaPendingTasksCount() {

  const { tasks } = useTasks()
  const { areas, hasAreaPanel } = useMyAreaTasks()

  const count = useMemo(() => {

    if (!hasAreaPanel || areas.length === 0) {
      return 0
    }

    let total = 0

    for (const task of tasks) {

      if (isWorkflowCompleted(task.workflowSteps)) {
        continue
      }

      const processes = getTaskProcesses(task)

      if (processes.some(process => areas.includes(process))) {
        total++
      }

    }

    return total

  }, [tasks, areas, hasAreaPanel])

  return count

}
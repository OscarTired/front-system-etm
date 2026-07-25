"use client"

import { useMemo } from "react"

import { isProcessStepReviewed } from "@/features/workflow/selectors/is-process-step-reviewed"

import { useMyAreaTasks } from "./use-my-area-tasks"
import { useMyAreaTaskColumns } from "./use-my-area-task-columns"

// Mismo hook de agrupado que usa TaskAreaPanel (useMyAreaTaskColumns)
// — acá solo se cuenta, sin filtrar ni ordenar (eso es presentación,
// propia del panel). "Pendiente" se decide por ÁREA
// (isProcessStepReviewed), no por tarea completa: una tarea puede
// estar revisada en Corte y seguir con ruta pendiente en Plegado;
// para un operario de Corte eso ya no le suma al contador.
//
// Se cuenta por Set de IDs, no sumando ocurrencias por columna: un
// supervisor con varias áreas activas puede tener la MISMA tarea
// pendiente en dos de sus columnas a la vez, y acá cuenta como una
// sola tarea pendiente, no dos.
export function useMyAreaPendingTasksCount() {

  const { areas, hasAreaPanel } = useMyAreaTasks()
  const { columns } = useMyAreaTaskColumns(areas)

  return useMemo(() => {

    if (!hasAreaPanel) {
      return 0
    }

    const pendingTaskIds = new Set<string>()

    for (const [process, tasks] of columns) {

      for (const task of tasks) {

        if (!isProcessStepReviewed(task.workflowSteps, process)) {
          pendingTaskIds.add(task.id)
        }

      }

    }

    return pendingTaskIds.size

  }, [columns, hasAreaPanel])

}
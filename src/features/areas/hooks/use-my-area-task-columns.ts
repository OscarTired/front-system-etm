"use client"

import { useMemo } from "react"

import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { getTaskProcesses } from "@/features/tasks/pipeline/utils/get-task-process"
import type { ProcessCode, Task } from "@/features/tasks/types/task.types"

// Agrupa TODAS las tareas del sistema por proceso, recortado a las
// áreas que le pasa el caller — única fuente de verdad para "qué
// tareas le tocan a mi(s) área(s)", consumida tanto por
// TaskAreaPanel como por useMyAreaPendingTasksCount.
//
// IMPORTANTE: `areas` entra como parámetro, este hook NO llama a
// useMyAreaTasks() por su cuenta. useMyAreaTasks() guarda
// supervisorAreas en un useState propio — si este hook lo llamara
// también, cada consumidor que lo use junto con su propio
// useMyAreaTasks() (como hacía TaskAreaPanel) termina con DOS
// instancias de ese estado que no se sincronizan entre sí: tocar un
// chip de área actualiza una instancia, pero las columnas leen de
// la otra y nunca se enteran. Recibiendo `areas` ya resuelto, solo
// existe una fuente de verdad para esa selección, sin importar
// cuántas veces se use este hook.
export function useMyAreaTaskColumns(areas: ProcessCode[]) {

  const { tasks, loading } = useTasks()

  const columns = useMemo(() => {

    const grouped = new Map<ProcessCode, Task[]>(
      areas.map(code => [code, [] as Task[]]),
    )

    for (const task of tasks) {

      const processes = getTaskProcesses(task)

      for (const process of processes) {
        grouped.get(process)?.push(task)
      }

    }

    return grouped

  }, [tasks, areas])

  return {
    columns,
    loading,
  }

}
"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TaskSortMode =
  | "manual"
  | "priority"
  | "delivery"
  | "sequence"
  | "code"

export type ProjectSortMode =
  | "manual"
  | "delivery"
  | "sequence"
  | "code"

/** Dirección de la lista (no aplica a mode "manual"). */
export type SortDirection = "asc" | "desc"

type SortStore = {
  taskSortMode: TaskSortMode
  projectSortMode: ProjectSortMode
  taskSortDirection: SortDirection
  projectSortDirection: SortDirection
  setTaskSortMode: (mode: TaskSortMode) => void
  setProjectSortMode: (mode: ProjectSortMode) => void
  setTaskSortDirection: (dir: SortDirection) => void
  setProjectSortDirection: (dir: SortDirection) => void
  toggleTaskSortDirection: () => void
  toggleProjectSortDirection: () => void
}

export const useSortStore = create<SortStore>()(
  persist(
    set => ({
      // Fuente de verdad UI: tareas por prioridad (URGENTE→BAJA).
      // El back entrega position asc (orden manual/drag); el front reordena.
      taskSortMode: "priority",
      projectSortMode: "code",
      taskSortDirection: "asc",
      projectSortDirection: "asc",

      setTaskSortMode: taskSortMode => set({ taskSortMode }),
      setProjectSortMode: projectSortMode => set({ projectSortMode }),
      setTaskSortDirection: taskSortDirection => set({ taskSortDirection }),
      setProjectSortDirection: projectSortDirection =>
        set({ projectSortDirection }),
      toggleTaskSortDirection: () =>
        set(s => ({
          taskSortDirection: s.taskSortDirection === "asc" ? "desc" : "asc",
        })),
      toggleProjectSortDirection: () =>
        set(s => ({
          projectSortDirection:
            s.projectSortDirection === "asc" ? "desc" : "asc",
        })),
    }),
    {
      name: "prod-erp-sort",
      version: 4,
      migrate: (persistedState: unknown, version) => {
        const prev = (persistedState ?? {}) as Record<string, unknown>
        // v4: default tareas = priority + dirección ASC/DESC
        if (version < 4) {
          return {
            ...prev,
            taskSortMode: "priority",
            projectSortMode: prev.projectSortMode ?? "code",
            taskSortDirection: "asc",
            projectSortDirection: "asc",
          }
        }
        return prev
      },
    },
  ),
)

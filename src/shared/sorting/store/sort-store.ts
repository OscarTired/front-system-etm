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

type SortStore = {
  taskSortMode: TaskSortMode
  projectSortMode: ProjectSortMode
  setTaskSortMode: (mode: TaskSortMode) => void
  setProjectSortMode: (mode: ProjectSortMode) => void
}

export const useSortStore = create<SortStore>()(
  persist(
    set => ({
      // Default: correlativo (code)
      taskSortMode: "code",
      projectSortMode: "code",

      setTaskSortMode: taskSortMode =>
        set({
          taskSortMode,
        }),

      setProjectSortMode: projectSortMode =>
        set({
          projectSortMode,
        }),
    }),
    {
      name: "prod-erp-sort",
      version: 3,
      migrate: (persistedState: any, version) => {
        // v3: forzar correlativo como default de listas
        if (version < 3) {
          return {
            ...persistedState,
            taskSortMode: "code",
            projectSortMode: "code",
          }
        }
        return persistedState
      },
    },
  ),
)

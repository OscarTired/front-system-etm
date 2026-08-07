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
      taskSortMode: "manual",
      projectSortMode: "manual",

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
      version: 2,
      migrate: (persistedState: any, version) => {
        if (version < 2) {
          return {
            ...persistedState,
            taskSortMode: "manual",
            projectSortMode: "manual",
          }
        }
        return persistedState
      },
    },
  ),
)
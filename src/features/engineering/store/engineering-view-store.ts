"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type EngineeringViewMode = "processes" | "list"

type Store = {
  viewMode: EngineeringViewMode
  setViewMode: (mode: EngineeringViewMode) => void
}

export const useEngineeringViewStore = create<Store>()(
  persist(
    set => ({
      viewMode: "processes",
      setViewMode: viewMode => set({ viewMode }),
    }),
    {
      name: "prod-erp-engineering-view",
      version: 1,
    },
  ),
)

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TeamBitacoraViewMode = "day" | "month" | "supervision"

type TeamBitacoraViewStore = {
  viewMode: TeamBitacoraViewMode
  setViewMode: (mode: TeamBitacoraViewMode) => void
}

export const useTeamBitacoraViewStore = create<TeamBitacoraViewStore>()(
  persist(
    set => ({
      viewMode: "day",
      setViewMode: viewMode => set({ viewMode }),
    }),
    {
      name: "prod-erp-team-bitacora-view",
      version: 1,
    },
  ),
)

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type BitacoraViewMode = "day" | "agenda"

type BitacoraViewStore = {
  viewMode: BitacoraViewMode
  setViewMode: (mode: BitacoraViewMode) => void
}

export const useBitacoraViewStore = create<BitacoraViewStore>()(
  persist(
    set => ({
      viewMode: "day",
      setViewMode: viewMode => set({ viewMode }),
    }),
    {
      name: "prod-erp-bitacora-view",
      version: 1,
    },
  ),
)
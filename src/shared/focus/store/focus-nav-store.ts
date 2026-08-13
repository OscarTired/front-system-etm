"use client"

import { create } from "zustand"

type FocusNavStore = {
  active: boolean
  label: string | null
  start: (label?: string) => void
  end: () => void
}

export const useFocusNavStore = create<FocusNavStore>(set => ({
  active: false,
  label: null,
  start: (label) => set({ active: true, label: label ?? "Dirigiendo…" }),
  end: () => set({ active: false, label: null }),
}))

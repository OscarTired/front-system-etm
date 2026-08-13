"use client"

import { create } from "zustand"

type FocusNavStore = {
  /** true mientras navegamos a un deep-link y el row aún no centró */
  active: boolean
  label: string | null
  start: (label?: string) => void
  end: () => void
}

export const useFocusNavStore = create<FocusNavStore>(set => ({
  active: false,
  label: null,
  start: (label) => set({ active: true, label: label ?? null }),
  end: () => set({ active: false, label: null }),
}))

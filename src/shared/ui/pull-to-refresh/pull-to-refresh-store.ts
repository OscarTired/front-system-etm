"use client"

import { create } from "zustand"

/**
 * Estado global del gesto pull-to-refresh.
 * El FAB (y otros chrome fixed) se desvanecen mientras el gesto
 * está activo para no pelear con el translateY del contenido.
 */
type PullToRefreshStore = {
  /** true mientras se tira o mientras corre el refresh */
  active: boolean
  setActive: (active: boolean) => void
}

export const usePullToRefreshStore = create<PullToRefreshStore>(set => ({
  active: false,
  setActive: active => set({ active }),
}))

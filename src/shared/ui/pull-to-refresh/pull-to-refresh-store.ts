"use client"

import { create } from "zustand"

type PullToRefreshStore = {
  /** true mientras se tira o mientras corre el refresh */
  active: boolean
  setActive: (active: boolean) => void
  /**
   * true mientras un drag de filas / activity tiene el gesto.
   * El PTR no debe robar touchmove en ese lapso.
   */
  dragLocked: boolean
  setDragLocked: (locked: boolean) => void
}

export const usePullToRefreshStore = create<PullToRefreshStore>(set => ({
  active: false,
  setActive: active => set({ active }),
  dragLocked: false,
  setDragLocked: locked => set({ dragLocked: locked }),
}))

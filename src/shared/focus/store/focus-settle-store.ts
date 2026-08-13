"use client"

import { create } from "zustand"

type FocusSettleStore = {
  /**
   * El `focusToken` (param `focus` de la URL) cuya secuencia de
   * scroll + expand ya terminó. Lo único que consume esto es el
   * gate de "recién ahí es seguro auto-abrir mensajes" en cada
   * *ExpandedRow (task/project/process).
   */
  settledToken: string | null
  markSettled: (token: string) => void
  reset: () => void
}

export const useFocusSettleStore = create<FocusSettleStore>(set => ({
  settledToken: null,
  markSettled: token => set({ settledToken: token }),
  reset: () => set({ settledToken: null }),
}))
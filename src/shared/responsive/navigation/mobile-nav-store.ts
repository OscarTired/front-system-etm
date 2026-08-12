"use client"

import { create } from "zustand"

export type DrawerMode = "open" | "closed"

type MobileNavState = {
  mode: DrawerMode
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}

function closePortaledOverlays() {
  // Sheets/FAB viven en portal (body). Al abrir el drawer el panel
  // se traslada; los portales no. Cerrar overlays evita chrome huérfano.
  window.dispatchEvent(new CustomEvent("close-all-popovers"))
}

export const useMobileNavStore = create<MobileNavState>()(set => ({
  mode: "closed",

  openDrawer: () => {
    closePortaledOverlays()
    set({ mode: "open" })
  },

  closeDrawer: () => set({ mode: "closed" }),

  toggleDrawer: () =>
    set(state => {
      const next: DrawerMode = state.mode === "open" ? "closed" : "open"
      if (next === "open") closePortaledOverlays()
      return { mode: next }
    }),
}))

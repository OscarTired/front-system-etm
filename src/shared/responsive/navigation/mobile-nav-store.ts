// mobile-nav-store.ts
"use client"
import { create } from "zustand"

export type DrawerMode = "open" | "closed"

/**
 * Antes este store tenía un `visualState` de 5 fases
 * (visible/moving-out/curve-closing/hidden/moving-in) para secuenciar
 * a mano dos transiciones CSS independientes (transform del contenido,
 * luego border-radius de la curva) vía eventos `transitionend`.
 *
 * Con `motion` (framer-motion) manejando el drag y el spring, tanto el
 * desplazamiento como el border-radius derivado se calculan del MISMO
 * motion value en tiempo real (ver CompactShell en app-shell.tsx) — no
 * hay nada que secuenciar porque no hay dos animaciones separadas que
 * sincronizar. `mode` (la intención del usuario) es ahora la única
 * fuente de verdad.
 */
type MobileNavState = {
  mode: DrawerMode

  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}

export const useMobileNavStore = create<MobileNavState>()((set) => ({

  mode: "closed",

  openDrawer: () => {
    // FAB/sheets viven en portal (body): no se mueven con el panel.
    // Cerrar overlays al abrir el menú evita chrome “plantado”.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("close-all-popovers"))
    }
    set({ mode: "open" })
  },

  closeDrawer: () => set({ mode: "closed" }),

  toggleDrawer: () =>
    set(state => {
      const next = state.mode === "open" ? "closed" : "open"
      if (next === "open" && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("close-all-popovers"))
      }
      return { mode: next }
    }),

}))

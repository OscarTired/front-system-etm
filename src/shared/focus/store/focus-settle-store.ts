"use client"

import { create } from "zustand"

type FocusSettleStore = {
  /**
   * El `focusToken` (param `focus` de la URL) del deep-link que ya
   * terminó su secuencia scroll → expand → corrección post-expand.
   * Mientras el token actual no coincida con este valor, los
   * paneles secundarios (ej. mensajes) no deben auto-abrirse.
   */
  settledToken: string | null
  markSettled: (token: string) => void
}

/**
 * Por qué un store en vez de prop-drilling: TaskTable/ProjectTable/
 * ProcessTableCard viven en un nivel, y TaskExpandedRow/
 * ProjectExpandedRow/ProcessExpandedRow en otro (con una card mobile
 * en el medio en el caso de tasks) — pasar esto por props significa
 * tocar 2-3 componentes intermedios por feature que no usan el
 * valor para nada más. Con un store, quien dispara la señal
 * (useFocusedRow, vía la tabla) y quien la consume (el expanded row)
 * no necesitan conocerse.
 */
export const useFocusSettleStore = create<FocusSettleStore>(set => ({
  settledToken: null,
  markSettled: token => set({ settledToken: token }),
}))
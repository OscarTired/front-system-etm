"use client"

import { create } from "zustand"

type PageSearchState = {
  /** Hay página con búsqueda registrada (móvil → icono en TopBar). */
  enabled: boolean
  open: boolean
  value: string
  placeholder: string
  onChange: ((value: string) => void) | null
  register: (opts: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => void
  /** Sincroniza el value controlado de la página sin re-register. */
  syncValue: (value: string) => void
  unregister: () => void
  setOpen: (open: boolean) => void
  setQuery: (value: string) => void
  closeAndClear: () => void
}

/**
 * Puente página ↔ TopBar móvil.
 * EntityToolbarSearch registra; TopBar pinta lupa + barra expandida.
 */
export const usePageSearchStore = create<PageSearchState>((set, get) => ({
  enabled: false,
  open: false,
  value: "",
  placeholder: "Buscar...",
  onChange: null,

  register: ({ value, onChange, placeholder }) => {
    set({
      enabled: true,
      value,
      onChange,
      placeholder: placeholder ?? "Buscar...",
      // Si ya había texto, mantener abierto
      open: get().open || Boolean(value),
    })
  },

  syncValue: value => set({ value }),

  unregister: () =>
    set({
      enabled: false,
      open: false,
      value: "",
      onChange: null,
      placeholder: "Buscar...",
    }),

  setOpen: open => set({ open }),

  setQuery: value => {
    set({ value })
    get().onChange?.(value)
  },

  closeAndClear: () => {
    const { onChange } = get()
    set({ open: false, value: "" })
    onChange?.("")
  },
}))

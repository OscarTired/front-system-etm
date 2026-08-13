"use client"

import { create } from "zustand"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "etm-theme"

type ThemeStore = {
  mode: ThemeMode
  /** Resolved light|dark after system */
  resolved: "light" | "dark"
  setMode: (mode: ThemeMode) => void
  /** Call once on client mount */
  hydrate: () => void
}

function getSystem(): "light" | "dark" {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolve(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? getSystem() : mode
}

function applyDom(resolved: "light" | "dark") {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "dark",
  resolved: "dark",

  setMode: mode => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
    const resolved = resolve(mode)
    applyDom(resolved)
    set({ mode, resolved })
  },

  hydrate: () => {
    let mode: ThemeMode = "dark"
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === "light" || raw === "dark" || raw === "system") mode = raw
    } catch {
      /* ignore */
    }
    const resolved = resolve(mode)
    applyDom(resolved)
    set({ mode, resolved })
  },
}))

export { STORAGE_KEY as THEME_STORAGE_KEY }

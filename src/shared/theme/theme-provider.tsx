"use client"

import { useEffect } from "react"

import { useThemeStore } from "./theme-store"

/**
 * Hidrata el tema desde localStorage y escucha prefers-color-scheme
 * cuando mode === "system".
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore(s => s.mode)
  const hydrate = useThemeStore(s => s.hydrate)
  const setMode = useThemeStore(s => s.setMode)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setMode("system")
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [mode, setMode])

  return <>{children}</>
}

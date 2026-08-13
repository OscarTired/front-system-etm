"use client"

import { useEffect } from "react"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { useFocusNavStore } from "./store/focus-nav-store"

const SAFETY_MS = 4000

export function FocusNavOverlay() {
  const active = useFocusNavStore(s => s.active)
  const label = useFocusNavStore(s => s.label)
  const end = useFocusNavStore(s => s.end)

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(end, SAFETY_MS)
    return () => window.clearTimeout(t)
  }, [active, end])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-background/55 backdrop-blur-md"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-chrome px-6 py-5 shadow-2xl">
        <Spinner size={22} className="text-primary" />
        <p className="text-sm font-medium text-foreground">
          {label ?? "Dirigiendo…"}
        </p>
      </div>
    </div>
  )
}

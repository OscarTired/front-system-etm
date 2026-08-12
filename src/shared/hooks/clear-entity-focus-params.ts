"use client"

import { useFocusSettleStore } from "@/shared/focus/store/focus-settle-store"

/**
 * Params de deep-link de entidad (tarea / proyecto / foco).
 * La URL es la fuente de verdad del foco programático.
 * Si el usuario toma el control (otro row, colapsar, nav limpia), se borran.
 */
const FOCUS_PARAM_KEYS = ["taskId", "projectId", "focus"] as const

/** Orígenes de navegación cross-feature (sessionStorage). */
const ORIGIN_STORAGE_KEYS = [
  "process-origin-task-id",
  "task-origin-project-id",
] as const

type RouterLike = {
  replace: (
    href: string,
    options?: { scroll?: boolean },
  ) => void
}

function clearOriginButtons() {
  if (typeof sessionStorage === "undefined") return
  for (const key of ORIGIN_STORAGE_KEYS) {
    sessionStorage.removeItem(key)
  }
  // Avisa a BackToTask / BackToProject para que se desmonten sin
  // depender solo del click del propio botón.
  window.dispatchEvent(new Event("entity-origin-cleared"))
}

export function clearEntityFocusParams(
  router: RouterLike,
  pathname: string,
  searchParams: { toString(): string },
): void {
  const next = new URLSearchParams(searchParams.toString())
  let changed = false

  for (const key of FOCUS_PARAM_KEYS) {
    if (next.has(key)) {
      next.delete(key)
      changed = true
    }
  }

  useFocusSettleStore.getState().reset()

  // URL consumida → no dejar residuos de "← Tarea" / "← Proyecto".
  if (changed) {
    clearOriginButtons()
  }

  if (!changed) return

  const query = next.toString()
  router.replace(query ? `${pathname}?${query}` : pathname, {
    scroll: false,
  })
}

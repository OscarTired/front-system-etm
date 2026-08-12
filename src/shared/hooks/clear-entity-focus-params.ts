"use client"

import { useFocusSettleStore } from "@/shared/focus/store/focus-settle-store"

/**
 * Params de deep-link de entidad (tarea / proyecto / foco).
 * La URL es la fuente de verdad del foco programático.
 * Si el usuario toma el control (otro row, colapsar, nav limpia), se borran.
 */
const FOCUS_PARAM_KEYS = ["taskId", "projectId", "focus"] as const

type RouterLike = {
  replace: (
    href: string,
    options?: { scroll?: boolean },
  ) => void
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

  // Siempre resetear settle al salir del deep-link (aunque la URL
  // ya estuviera limpia en un edge case).
  useFocusSettleStore.getState().reset()

  if (!changed) return

  const query = next.toString()
  router.replace(query ? `${pathname}?${query}` : pathname, {
    scroll: false,
  })
}

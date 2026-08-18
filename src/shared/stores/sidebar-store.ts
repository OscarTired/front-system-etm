// sidebar-store.ts
"use client"
import { create } from "zustand"

export type SidebarMode = "open" | "collapsed" | "closed"

/**
 * Estado visual del shell desktop.
 *
 * Cierre/apertura: una sola fase de ~300ms (width + radius en paralelo).
 * Ya no hay `curve-closing` en serie después de width→0.
 *
 * `curve-closing` se mantiene en el tipo solo por compatibilidad con
 * transitionend residuales; el flujo nuevo no lo usa como paso obligatorio.
 */
export type SidebarVisualState =
  | "visible"
  | "moving-out"
  | "curve-closing"
  | "hidden"
  | "moving-in"

type SidebarStore = {
  mode: SidebarMode
  lastVisibleMode: "open" | "collapsed"
  visualState: SidebarVisualState

  toggleCollapsed: () => void
  toggleClosed: () => void
  notifyContentTransitionEnd: () => void
  notifyClipTransitionEnd: () => void
}

function nextVisualState(
  nextMode: SidebarMode,
  current: SidebarVisualState,
): SidebarVisualState {
  if (nextMode === "closed") {
    if (current === "hidden") return "hidden"
    if (current === "moving-out") return "moving-out"
    // visible | moving-in | curve-closing → un solo cierre (width+radius)
    return "moving-out"
  }

  // open | collapsed
  if (
    current === "hidden" ||
    current === "curve-closing" ||
    current === "moving-out"
  ) {
    // Reabrir desde cualquier fase de cierre
    return "moving-in"
  }

  if (current === "moving-in") {
    return "moving-in"
  }

  return "visible"
}

export const useSidebarStore = create<SidebarStore>()(set => ({
  mode: "open",
  lastVisibleMode: "open",
  visualState: "visible",

  toggleCollapsed: () =>
    set(state => {
      if (state.mode === "closed") return state

      const next: SidebarMode = state.mode === "open" ? "collapsed" : "open"

      return {
        mode: next,
        lastVisibleMode: next,
        visualState: nextVisualState(next, state.visualState),
      }
    }),

  toggleClosed: () =>
    set(state => {
      const next: SidebarMode =
        state.mode === "closed" ? state.lastVisibleMode : "closed"

      return {
        mode: next,
        lastVisibleMode:
          state.mode === "closed"
            ? state.lastVisibleMode
            : (state.mode as "open" | "collapsed"),
        visualState: nextVisualState(next, state.visualState),
      }
    }),

  notifyContentTransitionEnd: () =>
    set(state => {
      // Cierre: width terminó → hidden en el mismo ciclo de 300ms
      // (radius ya iba en paralelo desde moving-out).
      if (
        state.mode === "closed" &&
        (state.visualState === "moving-out" ||
          state.visualState === "curve-closing")
      ) {
        return { visualState: "hidden" }
      }
      if (state.mode !== "closed" && state.visualState === "moving-in") {
        return { visualState: "visible" }
      }
      return state
    }),

  notifyClipTransitionEnd: () =>
    set(state => {
      // Fallback si solo llega el transitionend del radius
      if (
        state.mode === "closed" &&
        (state.visualState === "curve-closing" ||
          state.visualState === "moving-out")
      ) {
        return { visualState: "hidden" }
      }
      return state
    }),
}))

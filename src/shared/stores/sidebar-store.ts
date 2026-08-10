// sidebar-store.ts
"use client"
import { create } from "zustand"

export type SidebarMode = "open" | "collapsed" | "closed"

/**
 * Estado visual del shell desktop.
 *
 * Desacoplado de `mode`: `mode` es la INTENCIÓN funcional del usuario.
 * `visualState` es lo que la UI está haciendo ahora mismo, y es lo único
 * que AppSidebar / AppShell deben leer para renderizar.
 *
 * Transiciones dirigidas por:
 *   - cambios en `mode`
 *   - `notifyContentTransitionEnd` / `notifyClipTransitionEnd` (transitionend)
 *
 * Sin timers.
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
    if (current === "curve-closing") return "curve-closing"
    // visible | moving-in → empezar cierre de contenido
    return "moving-out"
  }

  // open | collapsed
  if (current === "hidden" || current === "curve-closing") {
    return "moving-in"
  }

  if (current === "moving-in") {
    return "moving-in"
  }

  if (current === "moving-out") {
    // Usuario reabrió a mitad del cierre: volver a entrar
    return "moving-in"
  }

  return "visible"
}

export const useSidebarStore = create<SidebarStore>()((set) => ({
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
      // Solo avanzar una fase; ignorar transitionend espurios
      // (p.ej. width+transform, o reflows por rows expandidos).
      if (state.mode === "closed" && state.visualState === "moving-out") {
        return { visualState: "curve-closing" }
      }
      if (state.mode !== "closed" && state.visualState === "moving-in") {
        return { visualState: "visible" }
      }
      return state
    }),

  notifyClipTransitionEnd: () =>
    set(state => {
      if (state.mode === "closed" && state.visualState === "curve-closing") {
        return { visualState: "hidden" }
      }
      return state
    }),
}))

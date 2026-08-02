"use client"

import { create } from "zustand"

export type DrawerMode =
  | "open"
  | "closed"

export type DrawerVisualState =
  | "visible"
  | "moving-out"
  | "curve-closing"
  | "hidden"
  | "moving-in"

type MobileNavState = {
  mode: DrawerMode
  visualState: DrawerVisualState

  // Vive ACÁ, no como useState local en app-shell.tsx, a propósito:
  // si isDragging y visualState fueran dos fuentes de estado
  // separadas (una en React, otra en Zustand), nada garantiza que
  // ambas lleguen al mismo commit cuando se actualizan juntas desde
  // un addEventListener nativo — eso es lo que causaba el salto
  // brusco al cerrar. Con las dos en el mismo store, un solo set()
  // las cambia atómicamente: la carrera es imposible por diseño, no
  // por sincronizarla después con flushSync.
  isDragging: boolean

  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void

  startDrag: () => void
  /** Apaga isDragging y, si corresponde, mueve visualState a "moving-out" — en un solo set() atómico. */
  endDrag: (shouldClose: boolean) => void

  notifyContentTransitionEnd: () => void
  notifyClipTransitionEnd: () => void
}

function nextVisualState(
  nextMode: DrawerMode,
  current: DrawerVisualState,
): DrawerVisualState {

  if (nextMode === "closed") {

    switch (current) {

      case "hidden":
      case "moving-out":
      case "curve-closing":
        return current

      default:
        return "moving-out"

    }

  }

  switch (current) {

    case "visible":
    case "moving-in":
      return current

    default:
      return "moving-in"

  }

}

export const useMobileNavStore = create<MobileNavState>()((set) => ({

  mode: "closed",

  visualState: "hidden",

  isDragging: false,

  openDrawer: () =>
    set(state => {

      if (state.mode === "open") {
        return state
      }

      return {
        mode: "open",
        visualState: nextVisualState(
          "open",
          state.visualState,
        ),
      }

    }),

  closeDrawer: () =>
    set(state => {

      if (state.mode === "closed") {
        return state
      }

      return {
        mode: "closed",
        visualState: nextVisualState(
          "closed",
          state.visualState,
        ),
      }

    }),

  toggleDrawer: () =>
    set(state => {

      const nextMode: DrawerMode =
        state.mode === "open"
          ? "closed"
          : "open"

      return {
        mode: nextMode,
        visualState: nextVisualState(
          nextMode,
          state.visualState,
        ),
      }

    }),

  startDrag: () => set({ isDragging: true }),

  endDrag: (shouldClose) =>
    set(state => {

      if (!shouldClose || state.mode === "closed") {
        return { isDragging: false }
      }

      return {
        isDragging: false,
        mode: "closed",
        visualState: nextVisualState(
          "closed",
          state.visualState,
        ),
      }

    }),

  notifyContentTransitionEnd: () =>
    set(state => {

      switch (state.visualState) {

        case "moving-in":
          return {
            visualState: "visible",
          }

        case "moving-out":
          return {
            visualState: "curve-closing",
          }

        default:
          return state

      }

    }),

  notifyClipTransitionEnd: () =>
    set(state => {

      if (state.visualState !== "curve-closing") {
        return state
      }

      return {
        visualState: "hidden",
      }

    }),

}))
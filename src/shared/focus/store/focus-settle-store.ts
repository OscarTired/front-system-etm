"use client"

import { create } from "zustand"

/** Tiempo mínimo de blur visible (ms), aunque el row se encuentre al instante. */
const MIN_SETTLING_MS = 420

type FocusSettleStore = {
  /** Token del deep-link en curso (aún no “listo” visualmente). */
  pendingToken: string | null
  /** Token cuya secuencia ya terminó (scroll + expand + post-expand). */
  settledToken: string | null
  /** Timestamp hasta el cual el blur debe seguir visible. */
  blurUntil: number
  /** Inicia secuencia para este focusToken (al montar el deep-link). */
  begin: (token: string) => void
  /**
   * Secuencia terminó. El blur se mantiene hasta MIN_SETTLING_MS
   * desde `begin`, para que se note aunque el row exista al instante.
   */
  markSettled: (token: string) => void
  /** Limpia estado (cambio de página, usuario toma el control). */
  reset: () => void
  /** ¿Hay que mostrar blur para este token? */
  isSettling: (token: string | undefined) => boolean
}

let blurClearTimer: ReturnType<typeof setTimeout> | null = null
let pendingStartedAt = 0

function clearBlurTimer() {
  if (blurClearTimer != null) {
    clearTimeout(blurClearTimer)
    blurClearTimer = null
  }
}

export const useFocusSettleStore = create<FocusSettleStore>((set, get) => ({
  pendingToken: null,
  settledToken: null,
  blurUntil: 0,

  begin: token => {
    clearBlurTimer()
    pendingStartedAt = Date.now()
    set({
      pendingToken: token,
      // Nuevo deep-link: no heredar settled del anterior
      settledToken: null,
      blurUntil: pendingStartedAt + MIN_SETTLING_MS,
    })
  },

  markSettled: token => {
    clearBlurTimer()
    const elapsed = Date.now() - pendingStartedAt
    const remain = Math.max(0, MIN_SETTLING_MS - elapsed)
    const blurUntil = Date.now() + remain

    set({
      pendingToken: null,
      settledToken: token,
      blurUntil,
    })

    if (remain > 0) {
      blurClearTimer = setTimeout(() => {
        // Fuerza re-render de quien usa isSettling
        set({ blurUntil: 0 })
        blurClearTimer = null
      }, remain + 16)
    }
  },

  reset: () => {
    clearBlurTimer()
    pendingStartedAt = 0
    set({
      pendingToken: null,
      settledToken: null,
      blurUntil: 0,
    })
  },

  isSettling: token => {
    if (!token) return false
    const { pendingToken, settledToken, blurUntil } = get()
    if (pendingToken === token) return true
    if (settledToken === token && Date.now() < blurUntil) return true
    return false
  },
}))

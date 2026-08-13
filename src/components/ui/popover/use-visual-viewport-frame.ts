"use client"

import * as React from "react"

export type VisualViewportFrame = {
  top: number
  left: number
  width: number
  height: number
  /** px desde el alto de layout "de verdad" (sin teclado) hasta el actual ≈ teclado */
  keyboardInset: number
  keyboardOpen: boolean
}

const KEYBOARD_THRESHOLD_PX = 50

// Máximo window.innerHeight visto hasta ahora, y el ancho con el que
// se registró (para resetear al rotar — la rotación cambia el ancho,
// el teclado no).
let stableLayoutHeight =
  typeof window !== "undefined" ? window.innerHeight : 0
let stableLayoutWidth =
  typeof window !== "undefined" ? window.innerWidth : 0

function measure(): VisualViewportFrame {
  if (typeof window === "undefined") {
    return {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      keyboardInset: 0,
      keyboardOpen: false,
    }
  }

  const layoutH = window.innerHeight
  const layoutW = window.innerWidth

  // Rotación (el ancho cambió, el teclado no lo cambia): el alto de
  // referencia viejo ya no vale, arrancamos de nuevo desde acá.
  if (layoutW !== stableLayoutWidth) {
    stableLayoutWidth = layoutW
    stableLayoutHeight = layoutH
  }

  if (layoutH > stableLayoutHeight) {
    stableLayoutHeight = layoutH
  }

  // Con interactiveWidget: resizes-content (ver app/layout.tsx), el
  // navegador achica window.innerHeight DE VERDAD cuando aparece el
  // teclado — así que comparar el alto actual contra el mayor que
  // vimos hasta ahora YA da el alto del teclado directamente. No
  // hace falta compararlo contra visualViewport: bajo este modo,
  // innerHeight y visualViewport.height se achican juntos, así que
  // compararlos entre sí siempre daría ~0 (por eso el cálculo viejo,
  // pensado para overlays-content, dejó de servir al cambiar de modo).
  const keyboardInset = Math.max(
    0,
    Math.round(stableLayoutHeight - layoutH),
  )

  return {
    top: 0,
    left: 0,
    width: layoutW,
    height: layoutH,
    keyboardInset,
    keyboardOpen: keyboardInset >= KEYBOARD_THRESHOLD_PX,
  }
}

/**
 * Bajo interactiveWidget: resizes-content, el navegador ya hace todo
 * el trabajo de achicar el viewport de layout con el teclado — este
 * hook solo expone esa medición (y calcula si el teclado está
 * abierto) para los pocos casos que necesitan saberlo explícitamente
 * (ej. un sheet que quiere ocupar más alto con teclado abierto).
 * Ya NO se usa para posicionar nada a mano (bottom, top, etc) —
 * eso ahora lo resuelve el propio CSS (fixed + dvh) automáticamente.
 */
export function useVisualViewportFrame(): VisualViewportFrame {
  const [frame, setFrame] = React.useState<VisualViewportFrame>(measure)

  React.useEffect(() => {
    let raf = 0
    const tick = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setFrame(measure()))
    }

    tick()
    window.addEventListener("resize", tick)
    window.addEventListener("focusin", tick)
    window.addEventListener("focusout", tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", tick)
      window.removeEventListener("focusin", tick)
      window.removeEventListener("focusout", tick)
    }
  }, [])

  return frame
}
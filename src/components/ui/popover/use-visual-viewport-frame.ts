"use client"

import * as React from "react"

export type VisualViewportFrame = {
  top: number
  left: number
  width: number
  height: number
  /** px desde el borde inferior del layout hasta el borde inferior del VV ≈ teclado */
  keyboardInset: number
  keyboardOpen: boolean
}

const KEYBOARD_THRESHOLD_PX = 50

// Máximo `window.innerHeight` visto hasta ahora, y el ancho con el
// que se registró — para poder resetear al rotar el dispositivo (ver
// más abajo). No es solo el valor al cargar la página: algunos
// navegadores achican innerHeight al rotar o en el primer paint antes
// de asentarse, así que lo tomamos como "el mayor que vimos".
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

  const vv = window.visualViewport
  const layoutH = window.innerHeight
  const layoutW = window.innerWidth

  if (!vv) {
    return {
      top: 0,
      left: 0,
      width: layoutW,
      height: layoutH,
      keyboardInset: 0,
      keyboardOpen: false,
    }
  }

  // Rotación (el ancho cambió, el teclado no lo cambia): el alto de
  // referencia viejo ya no vale, arrancamos de nuevo desde acá.
  if (layoutW !== stableLayoutWidth) {
    stableLayoutWidth = layoutW
    stableLayoutHeight = layoutH
  }

  // `interactiveWidget: overlays-content` (ver app/layout.tsx) le pide
  // al navegador que NO achique window.innerHeight cuando aparece el
  // teclado — pero no todos los Safari/WebView lo respetan igual. Si
  // el navegador SÍ lo achica, comparar contra el layoutH del momento
  // da ~0 (los dos números se achicaron juntos) y el código cree que
  // no hay teclado. Comparando contra el mayor innerHeight que vimos
  // hasta ahora, la detección funciona sea cual sea el comportamiento
  // real del navegador.
  if (layoutH > stableLayoutHeight) {
    stableLayoutHeight = layoutH
  }

  const keyboardInset = Math.max(
    0,
    Math.round(stableLayoutHeight - vv.height - vv.offsetTop),
  )

  return {
    top: vv.offsetTop,
    left: vv.offsetLeft,
    width: vv.width,
    height: vv.height,
    keyboardInset,
    keyboardOpen: keyboardInset >= KEYBOARD_THRESHOLD_PX,
  }
}

/**
 * Patrón Instagram:
 * el sheet se ancla con `bottom: keyboardInset` y su alto útil es
 * `height` del visualViewport (la zona libre sobre el teclado).
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
    const vv = window.visualViewport
    vv?.addEventListener("resize", tick)
    vv?.addEventListener("scroll", tick)
    window.addEventListener("resize", tick)
    window.addEventListener("focusin", tick)
    window.addEventListener("focusout", tick)

    return () => {
      cancelAnimationFrame(raf)
      vv?.removeEventListener("resize", tick)
      vv?.removeEventListener("scroll", tick)
      window.removeEventListener("resize", tick)
      window.removeEventListener("focusin", tick)
      window.removeEventListener("focusout", tick)
    }
  }, [])

  return frame
}
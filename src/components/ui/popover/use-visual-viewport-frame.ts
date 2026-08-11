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

  const keyboardInset = Math.max(
    0,
    Math.round(layoutH - vv.height - vv.offsetTop),
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

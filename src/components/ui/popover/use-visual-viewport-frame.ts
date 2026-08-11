"use client"

import * as React from "react"

export type VisualViewportFrame = {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Rectángulo del visual viewport en coords de layout (`position: fixed`).
 * El teclado móvil achica este rectángulo; el sheet se ancla a su borde inferior.
 */
export function useVisualViewportFrame() {
  const [frame, setFrame] = React.useState<VisualViewportFrame | null>(null)

  React.useEffect(() => {
    const vv = window.visualViewport

    const update = () => {
      if (!vv) {
        setFrame({
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        })
        return
      }
      setFrame({
        top: vv.offsetTop,
        left: vv.offsetLeft,
        width: vv.width,
        height: vv.height,
      })
    }

    update()
    vv?.addEventListener("resize", update)
    vv?.addEventListener("scroll", update)
    window.addEventListener("resize", update)

    return () => {
      vv?.removeEventListener("resize", update)
      vv?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return frame
}

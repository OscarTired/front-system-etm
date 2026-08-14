"use client"

import * as React from "react"

/**
 * true cuando el teclado virtual reduce el visualViewport de forma clara.
 * En F12 / desktop sin teclado on-screen → siempre false (no hay gap).
 */
export function useVirtualKeyboardOpen(thresholdPx = 120) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const check = () => {
      // layout viewport vs visual — teclado iOS/Android abre un hueco grande
      const gap = window.innerHeight - vv.height
      setOpen(gap > thresholdPx)
    }

    check()
    vv.addEventListener("resize", check)
    vv.addEventListener("scroll", check)
    window.addEventListener("resize", check)

    return () => {
      vv.removeEventListener("resize", check)
      vv.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [thresholdPx])

  return open
}

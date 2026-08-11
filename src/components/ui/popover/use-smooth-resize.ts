"use client"

import * as React from "react"

/** Mide el content-box del body del sheet para animar altura sin saltos. */
export function useSmoothResize() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{
    width: number | undefined
    height: number | undefined
  }>({ width: undefined, height: undefined })

  React.useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { containerRef, size }
}

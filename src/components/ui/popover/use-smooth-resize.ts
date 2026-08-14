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

    let frame = 0
    let pending: { width: number; height: number } | null = null

    const commit = () => {
      frame = 0
      if (!pending) return
      const next = pending
      pending = null
      setSize(prev => {
        if (prev.width === next.width && prev.height === next.height) {
          return prev
        }
        return next
      })
    }

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // Evita flash a 0 al cambiar de vista (opciones → valores)
        if (height < 1) continue
        pending = {
          width: Math.round(width),
          height: Math.round(height),
        }
        if (!frame) {
          frame = requestAnimationFrame(commit)
        }
      }
    })

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return { containerRef, size }
}

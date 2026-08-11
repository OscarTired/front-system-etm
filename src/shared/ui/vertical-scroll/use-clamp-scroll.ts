"use client"

import { useEffect, type RefObject } from "react"

/**
 * Cuando el contenido encoge (colapsar row, cerrar sidebar, reflow),
 * scrollTop puede quedar > maxScroll y se ve una franja vacía.
 * Esto es el dueño correcto del problema: el scroller, no el sidebar.
 */
export function useClampScroll(
  ref: RefObject<HTMLElement | null>,
  observeChildren = true,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const clamp = () => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight)
      if (el.scrollTop > max) {
        el.scrollTop = max
      }
    }

    clamp()

    const ro = new ResizeObserver(clamp)
    ro.observe(el)
    if (observeChildren && el.firstElementChild) {
      ro.observe(el.firstElementChild)
    }

    return () => ro.disconnect()
  }, [ref, observeChildren])
}

"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react"

export function useProcessBoardOverflow(
  containerRef: RefObject<HTMLDivElement | null>,
  deps: unknown[] = [],
) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const rafRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft < max - 4)
    }

    const schedule = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    update()
    el.addEventListener("scroll", schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(el)

    return () => {
      el.removeEventListener("scroll", schedule)
      ro.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, ...deps])

  return { canScrollLeft, canScrollRight }
}

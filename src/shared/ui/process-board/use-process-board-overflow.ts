"use client"

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react"

const FADE_MAX = 28

export function useProcessBoardOverflow(
  containerRef: RefObject<HTMLDivElement | null>,
  deps: unknown[] = [],
) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [leftFade, setLeftFade] = useState(0)
  const [rightFade, setRightFade] = useState(0)
  const rafRef = useRef<number | null>(null)

  const update = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    const left = el.scrollLeft > 2
    const right = el.scrollLeft < max - 2

    setCanScrollLeft(left)
    setCanScrollRight(right)
    setLeftFade(left ? FADE_MAX : 0)
    setRightFade(right ? FADE_MAX : 0)
  }, [containerRef])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const schedule = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    update()
    const t = window.setTimeout(update, 50)

    el.addEventListener("scroll", schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    for (const child of Array.from(el.children)) {
      ro.observe(child)
    }

    return () => {
      window.clearTimeout(t)
      el.removeEventListener("scroll", schedule)
      ro.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, update, ...deps])

  return { canScrollLeft, canScrollRight, leftFade, rightFade }
}

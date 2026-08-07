"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { RefreshCw } from "lucide-react"

// 64px de umbral y 0.5 de resistencia = convención UIRefreshControl / SwipeRefreshLayout.
const REFRESH_THRESHOLD = 64
const MAX_PULL = 96
const DRAG_RESISTANCE = 0.5

type Props = {
  children: React.ReactNode
}

/**
 * Busca el contenedor de scroll en cada gesto (no cachea el nodo).
 * VerticalScroll se remonta con key={pathname}; si cacheáramos el nodo,
 * los listeners quedarían en un DOM desmontado tras la 1ª navegación.
 */
function findScrollEl(root: HTMLElement | null): HTMLElement | null {
  return root?.querySelector<HTMLElement>("[data-vertical-scroll-container]") ?? null
}

export function PullToRefresh({ children }: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)

  const y = useMotionValue(0)
  const iconOpacity = useTransform(y, [0, REFRESH_THRESHOLD], [0, 1])
  const iconRotate = useTransform(y, [0, REFRESH_THRESHOLD], [0, 180])

  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  useEffect(() => {
    const root = wrapperRef.current
    if (!root) return

    let dragging = false
    let startY = 0

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current) return
      const scrollEl = findScrollEl(root)
      if (!scrollEl || scrollEl.scrollTop > 0) return
      dragging = true
      startY = event.touches[0].clientY
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!dragging) return

      const delta = event.touches[0].clientY - startY
      if (delta <= 0) {
        y.set(0)
        return
      }

      y.set(Math.min(MAX_PULL, delta * DRAG_RESISTANCE))
      event.preventDefault()
    }

    const handleTouchEnd = () => {
      if (!dragging) return
      dragging = false

      if (y.get() >= REFRESH_THRESHOLD) {
        setRefreshing(true)
        animate(y, REFRESH_THRESHOLD * 0.6)

        router.refresh()

        window.setTimeout(() => {
          setRefreshing(false)
          animate(y, 0)
        }, 800)
      } else {
        animate(y, 0)
      }
    }

    // Delegación en el wrapper (estable). El scrollEl se resuelve en cada touch.
    root.addEventListener("touchstart", handleTouchStart, { passive: true })
    root.addEventListener("touchmove", handleTouchMove, { passive: false })
    root.addEventListener("touchend", handleTouchEnd, { passive: true })
    root.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      root.removeEventListener("touchstart", handleTouchStart)
      root.removeEventListener("touchmove", handleTouchMove)
      root.removeEventListener("touchend", handleTouchEnd)
      root.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [y, router])

  return (
    <div ref={wrapperRef} className="relative flex min-h-0 flex-1 flex-col">
      <motion.div
        style={{ y, opacity: iconOpacity }}
        className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center"
      >
        <div className="flex size-9 items-center justify-center rounded-full bg-neutral-900/90 shadow-lg shadow-black/30 backdrop-blur-xl">
          <motion.div style={{ rotate: refreshing ? undefined : iconRotate }}>
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin text-cyan-400" : "text-neutral-300"}
            />
          </motion.div>
        </div>
      </motion.div>

      <motion.div style={{ y }} className="flex min-h-0 flex-1 flex-col">
        {children}
      </motion.div>
    </div>
  )
}
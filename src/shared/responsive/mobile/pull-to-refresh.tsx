"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { RefreshCw } from "lucide-react"

// 64px de umbral y 0.5 de resistencia no son números que yo haya
// elegido — son la convención real del gesto: UIRefreshControl de
// iOS dispara entre 60-80pt, SwipeRefreshLayout de Android usa un
// rango equivalente, y el "rubber-band" a mitad de velocidad (en vez
// de 1:1 con el dedo) es el mismo comportamiento que el overscroll
// nativo de iOS. No hay nada acá para "ajustar después" — es el
// estándar del patrón, no un valor de mi proyecto.
const REFRESH_THRESHOLD = 64
const MAX_PULL = 96
const DRAG_RESISTANCE = 0.5

type Props = {
  children: React.ReactNode
}

export function PullToRefresh({ children }: Props) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [refreshing, setRefreshing] = useState(false)

  const y = useMotionValue(0)
  const iconOpacity = useTransform(y, [0, REFRESH_THRESHOLD], [0, 1])
  const iconRotate = useTransform(y, [0, REFRESH_THRESHOLD], [0, 180])

  useEffect(() => {
    const scrollEl = wrapperRef.current?.querySelector<HTMLElement>("[data-vertical-scroll-container]")
    if (!scrollEl) return

    let dragging = false
    let startY = 0

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshing || scrollEl.scrollTop > 0) return
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

        // router.refresh() (Next.js App Router) revalida los datos
        // del servidor para la ruta actual sin hard-reload — no pierde
        // estado de cliente como haría window.location.reload().
        router.refresh()

        // App Router no expone una promesa para "cuándo terminó" el
        // refresh; el settle visual evita que el indicador desaparezca
        // de un salto apenas se dispara.
        window.setTimeout(() => {
          setRefreshing(false)
          animate(y, 0)
        }, 800)
      } else {
        animate(y, 0)
      }
    }

    scrollEl.addEventListener("touchstart", handleTouchStart, { passive: true })
    scrollEl.addEventListener("touchmove", handleTouchMove, { passive: false })
    scrollEl.addEventListener("touchend", handleTouchEnd, { passive: true })
    scrollEl.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      scrollEl.removeEventListener("touchstart", handleTouchStart)
      scrollEl.removeEventListener("touchmove", handleTouchMove)
      scrollEl.removeEventListener("touchend", handleTouchEnd)
      scrollEl.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [y, refreshing, router])

  return (
    <div ref={wrapperRef} className="relative flex min-h-0 flex-1 flex-col">
      <motion.div
        style={{ y, opacity: iconOpacity }}
        className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center"
      >
        <div className="flex size-9 items-center justify-center rounded-full bg-neutral-900/90 shadow-lg shadow-black/30 backdrop-blur-xl">
          <motion.div style={{ rotate: refreshing ? undefined : iconRotate }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin text-cyan-400" : "text-neutral-300"} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div style={{ y }} className="flex min-h-0 flex-1 flex-col">
        {children}
      </motion.div>
    </div>
  )
}

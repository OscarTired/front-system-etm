"use client"

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type TouchEvent,
} from "react"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"

/** Distancia de pull para armar el refresh. */
const THRESHOLD_PX = 72
/** Tope de arrastre (con resistencia). */
const MAX_PULL_PX = 112
/** Altura fija mientras refresca (estilo Material / Chrome). */
const HOLD_PX = 52
/** Tiempo mínimo visible del spinner antes de subir. */
const MIN_REFRESH_MS = 900

type Props = {
  children: ReactNode
  onRefresh: () => void | Promise<void>
  /** Contenedor con overflow-y (AppListScroll / ScrollArea). */
  scrollRef: RefObject<HTMLElement | null>
}

/**
 * Pull-to-refresh estilo Google/Chrome:
 * 1. Jalar → el contenido baja con resistencia; aparece Spinner (escala/opacidad).
 * 2. Soltar pasado el umbral → se queda HOLD_PX, Spinner gira ≥ ~1s.
 * 3. Termina el fetch → el contenido sube y el Spinner desaparece.
 *
 * Solo activo con scrollTop === 0.
 */
export function PullToRefresh({ children, onRefresh, scrollRef }: Props) {
  const startY = useRef(0)
  const pulling = useRef(false)
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const setPullOffset = useCallback((value: number) => {
    offsetRef.current = value
    setOffset(value)
  }, [])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing) return
      const el = scrollRef.current
      if (!el || el.scrollTop > 1) {
        pulling.current = false
        return
      }
      startY.current = e.touches[0].clientY
      pulling.current = true
    },
    [refreshing, scrollRef],
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) return
      const el = scrollRef.current
      if (!el || el.scrollTop > 1) {
        pulling.current = false
        setPullOffset(0)
        return
      }

      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setPullOffset(0)
        return
      }

      // Resistencia no lineal (más duro cuanto más tiras).
      const damped = Math.min(MAX_PULL_PX, dy * 0.42)
      setPullOffset(damped)
    },
    [refreshing, scrollRef, setPullOffset],
  )

  const runRefresh = useCallback(async () => {
    setRefreshing(true)
    setPullOffset(HOLD_PX)

    const started = Date.now()
    try {
      await onRefresh()
    } finally {
      const elapsed = Date.now() - started
      const wait = Math.max(0, MIN_REFRESH_MS - elapsed)
      if (wait > 0) {
        await new Promise(resolve => setTimeout(resolve, wait))
      }
      setRefreshing(false)
      setPullOffset(0)
    }
  }, [onRefresh, setPullOffset])

  const onTouchEnd = useCallback(() => {
    if (!pulling.current) return
    pulling.current = false

    if (refreshing) return

    if (offsetRef.current >= THRESHOLD_PX) {
      void runRefresh()
    } else {
      setPullOffset(0)
    }
  }, [refreshing, runRefresh, setPullOffset])

  const progress = Math.min(1, offset / THRESHOLD_PX)
  const armed = offset >= THRESHOLD_PX
  const showIndicator = offset > 6 || refreshing

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* Indicador fijo arriba — no empuja el layout; el translate del
          contenido deja el hueco visual (patrón Chrome). */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-end justify-center",
          "transition-opacity duration-150",
          showIndicator ? "opacity-100" : "opacity-0",
        )}
        style={{ height: Math.max(offset, refreshing ? HOLD_PX : 0) }}
        aria-hidden
      >
        <div
          className={cn(
            "mb-2 flex size-9 items-center justify-center rounded-full",
            "bg-[#141414]/90 text-neutral-200 shadow-md ring-1 ring-white/10 backdrop-blur-md",
            "transition-transform duration-150",
          )}
          style={{
            // Durante el pull: crece con el progreso; al refrescar: 1.
            transform: refreshing
              ? "scale(1)"
              : `scale(${0.55 + progress * 0.45})`,
            opacity: refreshing ? 1 : 0.35 + progress * 0.65,
          }}
        >
          <Spinner
            size={16}
            className={cn(
              "text-neutral-200",
              // Solo “activo” de verdad al refrescar o armado;
              // en pull temprano se ve quieto/atenuado por opacity.
              !refreshing && !armed && "opacity-70",
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          !pulling.current && "transition-transform duration-300 ease-out",
        )}
        style={{
          transform:
            offset > 0 || refreshing
              ? `translateY(${offset}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}

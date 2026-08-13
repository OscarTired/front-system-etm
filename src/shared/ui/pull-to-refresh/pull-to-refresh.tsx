"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type TouchEvent,
} from "react"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { TOP_BAR_HEIGHT_PX } from "@/shared/responsive/layout/chrome-constants"
import { cn } from "@/shared/utils/utils"
import { usePullToRefreshStore } from "./pull-to-refresh-store"


const THRESHOLD_PX = 64

const MAX_PULL_PX = 120

const HOLD_PX = 48

const MIN_REFRESH_MS = 900

const INDICATOR_GAP_PX = 10

type Props = {
  children: ReactNode
  onRefresh: () => void | Promise<void>
  scrollRef: RefObject<HTMLElement | null>
}

function damp(raw: number, max: number): number {
  if (raw <= 0) return 0
  return max * (1 - Math.exp(-raw / max))
}

function isInsideSheetOrPopover(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      '[data-slot="popover-content"],[data-slot="popover-sheet"],[data-slot="dialog-overlay"],[data-radix-dialog-overlay]',
    ),
  )
}

/** Handle / card de drag: el gesto es del DnD, no del PTR. */
function isDragGestureTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      "[data-drag-handle],[data-activity-drag],[data-dnd-row-handle]",
    ),
  )
}

/** Lupa / search del toolbar: no es pull-to-refresh. */
function isToolbarChromeTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest("[data-toolbar-search]"))
}

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
      // Drag de filas / activity tiene el gesto: no competir.
      if (usePullToRefreshStore.getState().dragLocked) {
        pulling.current = false
        return
      }
      if (isDragGestureTarget(e.target)) {
        pulling.current = false
        return
      }
      if (isToolbarChromeTarget(e.target)) {
        pulling.current = false
        return
      }
      // El sheet se porta a document.body en el DOM, pero React
      // burbujea eventos de portales según el árbol de React, no el
      // DOM real — así que arrastrar DENTRO de un sheet abierto
      // (para cerrarlo) también llega hasta acá si el Popover es
      // descendiente de este wrapper en el árbol de componentes.
      // Sin este chequeo, ese drag-to-dismiss también activa el PTR
      // de la página de atrás.
      if (isInsideSheetOrPopover(e.target)) {
        pulling.current = false
        return
      }
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
      if (usePullToRefreshStore.getState().dragLocked) {
        pulling.current = false
        setPullOffset(0)
        return
      }
      if (isDragGestureTarget(e.target)) {
        pulling.current = false
        setPullOffset(0)
        return
      }
      if (isToolbarChromeTarget(e.target)) {
        pulling.current = false
        setPullOffset(0)
        return
      }
      if (isInsideSheetOrPopover(e.target)) {
        pulling.current = false
        setPullOffset(0)
        return
      }
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

      setPullOffset(damp(dy, MAX_PULL_PX))
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
      const wait = Math.max(0, MIN_REFRESH_MS - (Date.now() - started))
      if (wait > 0) {
        await new Promise(r => setTimeout(r, wait))
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

  const setPtrActive = usePullToRefreshStore(s => s.setActive)
  const dragLocked = usePullToRefreshStore(s => s.dragLocked)

  useEffect(() => {
    const active = offset > 4 || refreshing
    setPtrActive(active)
    return () => {
      setPtrActive(false)
    }
  }, [offset, refreshing, setPtrActive])

  // Si un drag arranca a mitad de un pull, soltar el PTR sin pelear el gesto
  useEffect(() => {
    if (!dragLocked) return
    pulling.current = false
    setPullOffset(0)
  }, [dragLocked, setPullOffset])

  const progress = Math.min(1, offset / THRESHOLD_PX)
  const showIndicator = offset > 4 || refreshing

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >

      <div
        className={cn(
          "pointer-events-none fixed left-0 right-0 z-50 flex justify-center",
          "transition-opacity duration-200",
          showIndicator ? "opacity-100" : "opacity-0",
        )}
        style={{
          top: TOP_BAR_HEIGHT_PX + INDICATOR_GAP_PX,
        }}
        aria-hidden
      >
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            "bg-[#141414]/95 text-neutral-200 shadow-lg backdrop-blur-md",
          )}
          style={{
            transform: refreshing
              ? "scale(1)"
              : `scale(${0.5 + progress * 0.5})`,
            opacity: refreshing ? 1 : 0.25 + progress * 0.75,
            transition: pulling.current
              ? undefined
              : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease",
          }}
        >
          <Spinner size={16} className="text-neutral-200" />
        </div>
      </div>

      <div
        style={{
          transform: offset > 0 ? `translateY(${offset}px)` : undefined,
          // Bounce de regreso: spring-ish, no linear 200ms.
          transition: pulling.current
            ? "none"
            : "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
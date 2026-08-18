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
/** Umbral para armar el gesto (no pelear scroll nativo cerca del top). */
const ARM_DY_PX = 10
/** Snap-back corto; sin CSS transition 0.45s sobre toda la lista. */
const SNAP_MS = 180

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

function isDragGestureTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      "[data-drag-handle],[data-activity-drag],[data-dnd-row-handle]",
    ),
  )
}

function isToolbarChromeTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest("[data-toolbar-search]"))
}

export function PullToRefresh({ children, onRefresh, scrollRef }: Props) {
  const startY = useRef(0)
  const startX = useRef(0)
  /** Touch en top, aún sin dy suficiente. */
  const pending = useRef(false)
  /** Gesto PTR confirmado (pull down). */
  const pulling = useRef(false)
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const snapRaf = useRef(0)

  const setPullOffset = useCallback((value: number) => {
    offsetRef.current = value
    setOffset(value)
  }, [])

  const cancelSnap = useCallback(() => {
    if (snapRaf.current) {
      cancelAnimationFrame(snapRaf.current)
      snapRaf.current = 0
    }
  }, [])

  /** Baja offset a 0 en ~SNAP_MS con rAF (no CSS transition en el árbol). */
  const snapToZero = useCallback(() => {
    cancelSnap()
    const from = offsetRef.current
    if (from <= 0) {
      setPullOffset(0)
      return
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / SNAP_MS)
      // ease-out cubic — corto, no “viscoso”
      const eased = 1 - (1 - t) ** 3
      const next = from * (1 - eased)
      if (t >= 1 || next < 0.5) {
        setPullOffset(0)
        snapRaf.current = 0
        return
      }
      setPullOffset(next)
      snapRaf.current = requestAnimationFrame(tick)
    }
    snapRaf.current = requestAnimationFrame(tick)
  }, [cancelSnap, setPullOffset])

  useEffect(() => () => cancelSnap(), [cancelSnap])

  const abortGesture = useCallback(() => {
    pending.current = false
    pulling.current = false
    cancelSnap()
    setPullOffset(0)
  }, [cancelSnap, setPullOffset])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing) return
      if (usePullToRefreshStore.getState().dragLocked) {
        abortGesture()
        return
      }
      if (isDragGestureTarget(e.target)) {
        abortGesture()
        return
      }
      if (isToolbarChromeTarget(e.target)) {
        abortGesture()
        return
      }
      if (isInsideSheetOrPopover(e.target)) {
        abortGesture()
        return
      }
      const el = scrollRef.current
      if (!el || el.scrollTop > 1) {
        abortGesture()
        return
      }
      // No armar pull todavía: solo candidatura. El scroll nativo sigue libre.
      startY.current = e.touches[0].clientY
      startX.current = e.touches[0].clientX
      pending.current = true
      pulling.current = false
      cancelSnap()
    },
    [abortGesture, cancelSnap, refreshing, scrollRef],
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (refreshing) return
      if (!pending.current && !pulling.current) return

      if (usePullToRefreshStore.getState().dragLocked) {
        abortGesture()
        return
      }
      if (isDragGestureTarget(e.target)) {
        abortGesture()
        return
      }
      if (isToolbarChromeTarget(e.target)) {
        abortGesture()
        return
      }
      if (isInsideSheetOrPopover(e.target)) {
        abortGesture()
        return
      }
      const el = scrollRef.current
      if (!el || el.scrollTop > 1) {
        abortGesture()
        return
      }

      const dy = e.touches[0].clientY - startY.current
      const dx = e.touches[0].clientX - startX.current

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
        abortGesture()
        return
      }

      // Subir = scroll nativo; soltar candidatura PTR.
      if (dy <= 0) {
        if (pulling.current) {
          pulling.current = false
          setPullOffset(0)
        }
        return
      }

      // Armar solo con pull down claro desde el top.
      if (!pulling.current) {
        if (dy < ARM_DY_PX) return
        pulling.current = true
        pending.current = false
      }

      setPullOffset(damp(dy, MAX_PULL_PX))
    },
    [abortGesture, refreshing, scrollRef, setPullOffset],
  )

  const runRefresh = useCallback(async () => {
    cancelSnap()
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
      snapToZero()
    }
  }, [cancelSnap, onRefresh, setPullOffset, snapToZero])

  const onTouchEnd = useCallback(() => {
    if (!pending.current && !pulling.current) return
    pending.current = false

    if (!pulling.current) return
    pulling.current = false
    if (refreshing) return

    if (offsetRef.current >= THRESHOLD_PX) {
      void runRefresh()
    } else {
      snapToZero()
    }
  }, [refreshing, runRefresh, snapToZero])

  const setPtrActive = usePullToRefreshStore(s => s.setActive)
  const dragLocked = usePullToRefreshStore(s => s.dragLocked)

  useEffect(() => {
    const active = offset > 4 || refreshing
    setPtrActive(active)
    return () => {
      setPtrActive(false)
    }
  }, [offset, refreshing, setPtrActive])

  useEffect(() => {
    if (!dragLocked) return
    abortGesture()
  }, [dragLocked, abortGesture])

  const progress = Math.min(1, offset / THRESHOLD_PX)
  const showIndicator = offset > 4 || refreshing
  const contentOffset = offset > 0.5 ? offset : 0

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
          "transition-opacity duration-150",
          showIndicator ? "opacity-100" : "opacity-0",
        )}
        style={{ top: TOP_BAR_HEIGHT_PX + INDICATOR_GAP_PX }}
        aria-hidden
      >
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            "bg-muted/95 text-foreground shadow-lg backdrop-blur-md",
          )}
          style={{
            transform: refreshing
              ? "scale(1)"
              : `scale(${0.5 + progress * 0.5})`,
            opacity: refreshing ? 1 : 0.25 + progress * 0.75,
          }}
        >
          <Spinner size={16} className="text-foreground" />
        </div>
      </div>

      {/* Sin transition CSS en transform: el snap es rAF (~180ms). */}
      <div
        style={
          contentOffset > 0
            ? { transform: `translateY(${contentOffset}px)` }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef } from "react"

type Props = {
  focusedId?: string
  /** Row expandido actual — si diverge del deep-link, se corta el scroll programático. */
  expandedRowId?: string | null
  setExpandedRowId: (id: string | null) => void
  focusToken?: string
}

const LAYOUT_SETTLE_MS = 150
const FIND_TIMEOUT_MS = 2500

function isScrollable(el: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(el)
  if (
    overflowY !== "auto" &&
    overflowY !== "scroll" &&
    overflowY !== "overlay"
  ) {
    return false
  }
  return el.scrollHeight > el.clientHeight + 1
}

function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement
  while (parent) {
    if (isScrollable(parent)) return parent
    parent = parent.parentElement
  }
  return null
}

function centerInScrollParent(el: HTMLElement, behavior: ScrollBehavior) {
  const parent = getScrollParent(el)

  if (!parent) {
    el.scrollIntoView({ behavior, block: "center" })
    return
  }

  const parentRect = parent.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  const elMid =
    elRect.top - parentRect.top + parent.scrollTop + elRect.height / 2
  const target = elMid - parent.clientHeight / 2
  const max = Math.max(0, parent.scrollHeight - parent.clientHeight)
  const top = Math.max(0, Math.min(target, max))

  parent.scrollTo({ top, behavior })
}

/**
 * Centra mientras crece el expandido del deep-link.
 * `isActive` debe ser false en cuanto el usuario abre otro row
 * (si no, el ResizeObserver del colapso vuelve a scrollear al foco viejo).
 */
function trackUntilSettled(
  el: HTMLElement,
  isActive: () => boolean,
): () => void {
  let settleTimer: number | null = null
  let rafId = 0
  let pendingCenter = false
  let lastHeight = -1
  let disposed = false

  const centerNow = (behavior: ScrollBehavior) => {
    if (disposed || !isActive()) return
    centerInScrollParent(el, behavior)
  }

  const scheduleSettle = () => {
    if (settleTimer !== null) window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(() => {
      settleTimer = null
      centerNow("smooth")
    }, LAYOUT_SETTLE_MS)
  }

  const onLayout = () => {
    if (disposed || !isActive()) return
    const height = el.getBoundingClientRect().height
    if (height === lastHeight) {
      scheduleSettle()
      return
    }
    lastHeight = height
    if (!pendingCenter) {
      pendingCenter = true
      rafId = window.requestAnimationFrame(() => {
        pendingCenter = false
        centerNow("auto")
      })
    }
    scheduleSettle()
  }

  centerNow("auto")
  scheduleSettle()

  const ro = new ResizeObserver(() => {
    onLayout()
  })
  ro.observe(el)

  return () => {
    disposed = true
    ro.disconnect()
    if (settleTimer !== null) window.clearTimeout(settleTimer)
    window.cancelAnimationFrame(rafId)
  }
}

function waitForRow(
  selector: string,
  onFound: (el: HTMLElement) => void,
  timeoutMs: number,
  isActive: () => boolean,
): () => void {
  const existing = document.querySelector<HTMLElement>(selector)
  if (existing) {
    onFound(existing)
    return () => {}
  }

  let cancelled = false
  let raf = 0
  const start = performance.now()

  const tick = () => {
    if (cancelled || !isActive()) return
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      onFound(el)
      return
    }
    if (performance.now() - start >= timeoutMs) return
    raf = window.requestAnimationFrame(tick)
  }

  raf = window.requestAnimationFrame(tick)

  return () => {
    cancelled = true
    window.cancelAnimationFrame(raf)
  }
}

/**
 * Foco programático desde la URL.
 *
 * Contrato:
 * - Entra deep-link → expand + scroll una vez (mientras el expand sea ese id).
 * - Usuario abre otro row / cierra el foco → se corta el tracking al instante
 *   (no se re-centra al colapsar el row de la URL).
 * - Limpiar params de la URL es responsabilidad de `useExpandRow`.
 */
export function useFocusedRow({
  focusedId,
  expandedRowId = null,
  setExpandedRowId,
  focusToken,
}: Props) {
  const prevFocusedIdRef = useRef<string | undefined>(undefined)
  const expandedRowIdRef = useRef<string | null>(expandedRowId)
  expandedRowIdRef.current = expandedRowId

  const stopTrackingRef = useRef<(() => void) | null>(null)

  const stopTracking = () => {
    stopTrackingRef.current?.()
    stopTrackingRef.current = null
  }

  // Usuario tomó el control: cortar scroll YA (antes de que el RO del colapso dispare).
  useEffect(() => {
    if (!focusedId) return
    if (expandedRowId != null && expandedRowId !== focusedId) {
      stopTracking()
    }
  }, [expandedRowId, focusedId])

  useEffect(() => {
    if (!focusedId) {
      stopTracking()

      const prev = prevFocusedIdRef.current
      prevFocusedIdRef.current = undefined

      if (prev && expandedRowIdRef.current === prev) {
        setExpandedRowId(null)
      }
      return
    }

    // URL aún tiene foco pero el usuario ya expandió otro → no forzar ni scrollear.
    if (
      expandedRowIdRef.current != null &&
      expandedRowIdRef.current !== focusedId
    ) {
      stopTracking()
      return
    }

    prevFocusedIdRef.current = focusedId
    setExpandedRowId(focusedId)

    const selector = `[data-expanded-row-id="${CSS.escape(focusedId)}"]`
    const isActive = () => {
      // Activo solo mientras el deep-link sigue y el expand es ese id (o aún null en el primer tick).
      const expanded = expandedRowIdRef.current
      return (
        prevFocusedIdRef.current === focusedId &&
        (expanded == null || expanded === focusedId)
      )
    }

    stopTracking()

    const stopWait = waitForRow(
      selector,
      el => {
        if (!isActive()) return
        stopTracking()
        stopTrackingRef.current = trackUntilSettled(el, isActive)
      },
      FIND_TIMEOUT_MS,
      isActive,
    )

    stopTrackingRef.current = () => {
      stopWait()
    }

    return () => {
      stopTracking()
    }
  }, [focusedId, setExpandedRowId, focusToken])
}

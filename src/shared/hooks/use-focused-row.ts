"use client"

import { useEffect, useRef } from "react"

type Props = {
  focusedId?: string
  /** Row expandido actual (para no cerrar un expand manual al limpiar la URL). */
  expandedRowId?: string | null
  setExpandedRowId: (id: string | null) => void
  focusToken?: string
}

/** Quiet period after the last layout change before we consider height final. */
const LAYOUT_SETTLE_MS = 150

/** If the row never appears (filtered / bad id), stop waiting. */
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

/**
 * Nearest ancestor that actually scrolls (AppListScroll / EntityTable / pane).
 * Never assume window.
 */
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
 * Center while expanded content grows; one smooth settle when height stabilizes.
 * Throttled to 1 scroll per frame — avoids trave on mobile when pipeline mounts.
 */
function trackUntilSettled(el: HTMLElement): () => void {
  let settleTimer: number | null = null
  let rafId = 0
  let pendingCenter = false
  let lastHeight = -1
  let disposed = false

  const centerNow = (behavior: ScrollBehavior) => {
    if (disposed) return
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
    if (disposed) return
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
    if (cancelled) return
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
 * Foco programático desde la URL (`taskId` / `projectId`).
 *
 * - Solo reacciona a cambios de `focusedId` / `focusToken` (no a expands manuales).
 * - Si la URL pierde el id y el row abierto sigue siendo el del deep-link → se cierra.
 * - Si el usuario ya abrió otro row → no se toca su expand.
 *
 * La liberación del deep-link (borrar params) la hace quien expande manualmente
 * vía `useExpandRow` / `clearEntityFocusParams`.
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

  useEffect(() => {
    if (!focusedId) {
      const prev = prevFocusedIdRef.current
      prevFocusedIdRef.current = undefined

      // Sidebar / URL limpia: cerrar solo si aún está el row del deep-link.
      if (prev && expandedRowIdRef.current === prev) {
        setExpandedRowId(null)
      }
      return
    }

    prevFocusedIdRef.current = focusedId
    setExpandedRowId(focusedId)

    const selector = `[data-expanded-row-id="${CSS.escape(focusedId)}"]`

    let stopTracking: (() => void) | null = null

    const stopWait = waitForRow(
      selector,
      el => {
        stopTracking?.()
        stopTracking = trackUntilSettled(el)
      },
      FIND_TIMEOUT_MS,
    )

    return () => {
      stopWait()
      stopTracking?.()
    }
    // expandedRowId deliberadamente fuera: un expand manual no debe
    // re-disparar scroll/expand hacia el id de la URL.
  }, [focusedId, setExpandedRowId, focusToken])
}

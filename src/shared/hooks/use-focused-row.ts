"use client"

import { useEffect, useRef } from "react"

type Props = {
  focusedId?: string
  /** Row expandido actual — si diverge del deep-link, se corta el scroll. */
  expandedRowId?: string | null
  setExpandedRowId: (id: string | null) => void
  focusToken?: string
}

const FIND_TIMEOUT_MS = 2500
/** Una sola corrección tras el expand (altura ya estable). Sin smooth. */
const POST_EXPAND_MS = 220

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

/** Posiciona sin animación — evita rebote al abrir otro row. */
function centerInScrollParent(el: HTMLElement) {
  const parent = getScrollParent(el)

  if (!parent) {
    el.scrollIntoView({ behavior: "auto", block: "center" })
    return
  }

  const parentRect = parent.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const elMid =
    elRect.top - parentRect.top + parent.scrollTop + elRect.height / 2
  const target = elMid - parent.clientHeight / 2
  const max = Math.max(0, parent.scrollHeight - parent.clientHeight)
  const top = Math.max(0, Math.min(target, max))

  parent.scrollTo({ top, behavior: "auto" })
}

/**
 * Deep-link: lleva el row a vista y listo.
 * No hay ResizeObserver ni smooth en bucle (eso producía el rebote
 * al scrollear y abrir otro expandido).
 */
function focusRowOnce(el: HTMLElement, isActive: () => boolean): () => void {
  let disposed = false
  let timer: number | null = null

  const run = () => {
    if (disposed || !isActive()) return
    centerInScrollParent(el)
  }

  run()
  timer = window.setTimeout(run, POST_EXPAND_MS)

  return () => {
    disposed = true
    if (timer !== null) window.clearTimeout(timer)
  }
}

function waitForRow(
  selector: string,
  onFound: (el: HTMLElement) => void,
  timeoutMs: number,
  isActive: () => boolean,
): () => void {
  const root = document.body
  let cancelled = false
  let raf = 0
  const start = performance.now()

  const tryFind = () => {
    if (cancelled || !isActive()) return
    const el = root.querySelector<HTMLElement>(selector)
    if (el) {
      onFound(el)
      return
    }
    if (performance.now() - start >= timeoutMs) return
    raf = window.requestAnimationFrame(tryFind)
  }

  raf = window.requestAnimationFrame(tryFind)

  return () => {
    cancelled = true
    window.cancelAnimationFrame(raf)
  }
}

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

  // Usuario expandió otro row: cortar ya.
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
        stopTrackingRef.current = focusRowOnce(el, isActive)
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

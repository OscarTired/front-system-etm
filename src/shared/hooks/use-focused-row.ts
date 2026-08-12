"use client"

import { useEffect, useRef } from "react"

type Props = {
  focusedId?: string
  /** Row expandido actual — si diverge del deep-link, se corta el scroll. */
  expandedRowId?: string | null
  setExpandedRowId: (id: string | null) => void
  focusToken?: string
  /**
   * Se llama una sola vez, después de scrollear + expandir + la
   * corrección post-expand — ahí es seguro disparar cosas
   * secundarias (ej. abrir el panel de mensajes), en vez de que
   * salten apenas el row monta, a mitad del scroll.
   */
  onSettled?: () => void
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
 * Secuencia deep-link, en orden: el row YA existe en el DOM
 * (colapsado) porque `data-expanded-row-id` se pone sin importar el
 * estado de expansión — así que primero centramos el scroll ahí
 * (con el row todavía colapsado), DESPUÉS lo expandimos, y recién
 * cuando la corrección post-expand corrió (altura ya estable),
 * avisamos `onSettled` para que paneles secundarios (mensajes) se
 * abran. Sin esto, todo pasaba a la vez: expandía, el panel de
 * mensajes se abría de golpe, y el scroll llegaba después/durante.
 */
function scrollExpandAndSettle(
  el: HTMLElement,
  isActive: () => boolean,
  expand: () => void,
  onSettled: (() => void) | undefined,
): () => void {
  let disposed = false
  let timer: number | null = null

  if (disposed || !isActive()) return () => {}

  // 1. Scroll (row colapsado todavía).
  centerInScrollParent(el)

  // 2. Expandir.
  expand()

  // 3. Corrección post-expand (la altura cambió al expandir) y
  //    recién ahí, "settled" — señal para abrir mensajes/etc.
  const run = () => {
    if (disposed || !isActive()) return
    centerInScrollParent(el)
  }

  timer = window.setTimeout(() => {
    run()
    if (!disposed && isActive()) onSettled?.()
  }, POST_EXPAND_MS)

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
  onTimeout?: () => void,
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
    if (performance.now() - start >= timeoutMs) {
      onTimeout?.()
      return
    }
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
  onSettled,
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

    // Todavía NO expandimos — el orden correcto es scroll primero,
    // con el row visible pero colapsado (existe en el DOM igual,
    // `data-expanded-row-id` no depende de estar expandido).
    const selector = `[data-expanded-row-id="${CSS.escape(focusedId)}"]`
    const isActive = () => {
      const expanded = expandedRowIdRef.current
      return (
        prevFocusedIdRef.current === focusedId &&
        (expanded == null || expanded === focusedId)
      )
    }

    stopTracking()

    const expand = () => setExpandedRowId(focusedId)

    const stopWait = waitForRow(
      selector,
      el => {
        if (!isActive()) return
        stopTracking()
        stopTrackingRef.current = scrollExpandAndSettle(
          el,
          isActive,
          expand,
          onSettled,
        )
      },
      FIND_TIMEOUT_MS,
      isActive,
      () => {
        // No lo encontramos a tiempo: mejor expandir igual (aunque
        // no lleguemos a scrollear) que dejar el deep-link sin efecto.
        if (!isActive()) return
        expand()
        onSettled?.()
      },
    )

    stopTrackingRef.current = () => {
      stopWait()
    }

    return () => {
      stopTracking()
    }
  }, [focusedId, setExpandedRowId, focusToken, onSettled])
}
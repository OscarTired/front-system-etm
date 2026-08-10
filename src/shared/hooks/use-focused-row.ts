"use client"

import {
  useEffect,
} from "react"

type Props = {
  focusedId?: string
  setExpandedRowId: (id: string | null) => void
  focusToken?: string
}

/** Quiet period after the last layout change before we consider height final. */
const LAYOUT_SETTLE_MS = 120

/** If the row never appears (filtered / bad id), stop waiting. */
const FIND_TIMEOUT_MS = 4000

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
 * Nearest ancestor that actually scrolls. Lists live inside
 * `overflow-y-auto` panes — never assume `window`.
 */
function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement
  while (parent) {
    if (isScrollable(parent)) return parent
    parent = parent.parentElement
  }
  return null
}

/**
 * Center `el` inside its scroll parent (or the viewport).
 * `behavior: "auto"` while layout is still changing; `"smooth"` only
 * for the final settle so we don't stack competing smooth scrolls.
 */
function centerInScrollParent(
  el: HTMLElement,
  behavior: ScrollBehavior,
) {
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
 * Keep the focused row centered while its expanded content grows,
 * then do one smooth center when height stops changing.
 *
 * Driven by ResizeObserver (real layout), not a fixed animation delay.
 */
function trackUntilSettled(el: HTMLElement): () => void {
  let settleTimer: number | null = null
  let rafId = 0
  let lastHeight = -1
  let disposed = false

  const centerNow = (behavior: ScrollBehavior) => {
    if (disposed) return
    centerInScrollParent(el, behavior)
  }

  const scheduleSettle = () => {
    if (settleTimer !== null) {
      window.clearTimeout(settleTimer)
    }
    // Layout went quiet → height is final for this open cycle.
    settleTimer = window.setTimeout(() => {
      settleTimer = null
      centerNow("smooth")
      // One more frame after paint of the smooth target's start.
      rafId = window.requestAnimationFrame(() => {
        centerNow("smooth")
      })
    }, LAYOUT_SETTLE_MS)
  }

  const onLayout = () => {
    if (disposed) return
    const height = el.getBoundingClientRect().height
    // Skip no-ops (observer can fire without size change).
    if (height === lastHeight) {
      scheduleSettle()
      return
    }
    lastHeight = height
    // Instant track while KPIs / pipeline / comments mount.
    centerNow("auto")
    scheduleSettle()
  }

  // Initial center (collapsed or already expanded).
  centerNow("auto")
  scheduleSettle()

  const ro = new ResizeObserver(() => {
    // rAF: read layout after the browser applies the new size.
    rafId = window.requestAnimationFrame(onLayout)
  })
  ro.observe(el)

  return () => {
    disposed = true
    ro.disconnect()
    if (settleTimer !== null) window.clearTimeout(settleTimer)
    window.cancelAnimationFrame(rafId)
  }
}

export function useFocusedRow({
  focusedId,
  setExpandedRowId,
  focusToken,
}: Props) {

  useEffect(() => {

    if (!focusedId) {
      return
    }

    setExpandedRowId(focusedId)

    const selector = `[data-expanded-row-id="${CSS.escape(focusedId)}"]`

    let stopTracking: (() => void) | null = null
    let findTimeout = 0
    let mutation: MutationObserver | null = null

    const attach = (el: HTMLElement) => {
      mutation?.disconnect()
      mutation = null
      stopTracking?.()
      stopTracking = trackUntilSettled(el)
    }

    const existing = document.querySelector<HTMLElement>(selector)
    if (existing) {
      attach(existing)
    } else {
      // Row not in DOM yet (expand / filter / data loading).
      mutation = new MutationObserver(() => {
        const el = document.querySelector<HTMLElement>(selector)
        if (el) attach(el)
      })
      mutation.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    findTimeout = window.setTimeout(() => {
      mutation?.disconnect()
      mutation = null
    }, FIND_TIMEOUT_MS)

    return () => {
      mutation?.disconnect()
      stopTracking?.()
      window.clearTimeout(findTimeout)
    }

  }, [
    focusedId,
    setExpandedRowId,
    focusToken,
  ])

}

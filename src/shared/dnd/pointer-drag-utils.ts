/**
 * Primitivas compartidas del drag por pointer (rows + activities).
 * Una sola fuente: clearance del dedo + auto-scroll en bordes.
 */

/** Eleva el ghost por encima del dedo para que no tape el contenido. */
export const DRAG_OVERLAY_CLEARANCE_PX = 64

/** Zona (px) desde el borde del scroller que activa auto-scroll. */
export const DRAG_SCROLL_EDGE_PX = 80

/** Velocidad máx. de auto-scroll (px / frame aprox.). */
export const DRAG_SCROLL_MAX_SPEED = 22

export function findVerticalScrollParent(
  start: HTMLElement | null,
): HTMLElement | null {
  let node: HTMLElement | null = start

  while (node && node !== document.body) {
    const style = window.getComputedStyle(node)
    const oy = style.overflowY
    const canScroll =
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      node.scrollHeight > node.clientHeight + 1

    if (canScroll) return node
    node = node.parentElement
  }

  const se = document.scrollingElement
  if (se instanceof HTMLElement && se.scrollHeight > se.clientHeight + 1) {
    return se
  }

  return null
}

/**
 * Si el puntero está cerca del borde superior/inferior del scroller,
 * desplaza el contenido (comportamiento nativo de listas).
 */
export function autoScrollAtPointer(
  clientY: number,
  scrollParent: HTMLElement | null,
  edgePx: number = DRAG_SCROLL_EDGE_PX,
  maxSpeed: number = DRAG_SCROLL_MAX_SPEED,
): boolean {
  if (!scrollParent) return false

  const rect = scrollParent.getBoundingClientRect()
  const topZone = rect.top + edgePx
  const bottomZone = rect.bottom - edgePx

  if (clientY < topZone) {
    const intensity = Math.min(1, (topZone - clientY) / edgePx)
    const delta = Math.ceil(maxSpeed * intensity)
    const prev = scrollParent.scrollTop
    scrollParent.scrollTop = prev - delta
    return scrollParent.scrollTop !== prev
  }

  if (clientY > bottomZone) {
    const intensity = Math.min(1, (clientY - bottomZone) / edgePx)
    const delta = Math.ceil(maxSpeed * intensity)
    const prev = scrollParent.scrollTop
    scrollParent.scrollTop = prev + delta
    return scrollParent.scrollTop !== prev
  }

  return false
}

/** top del overlay: por encima del dedo, no debajo. */
export function overlayTopAbovePointer(clientY: number): number {
  return clientY - DRAG_OVERLAY_CLEARANCE_PX
}

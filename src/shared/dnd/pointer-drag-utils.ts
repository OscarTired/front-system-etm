/**
 * Primitivas compartidas del drag por pointer (rows + activities).
 * Una sola fuente: clearance del dedo + auto-scroll en bordes + posición overlay.
 */

/** Eleva el ghost por encima del dedo (móvil y desktop). */
export const DRAG_OVERLAY_CLEARANCE_PX = 56

/** Ancho típico del chip de overlay. */
export const DRAG_OVERLAY_WIDTH_PX = 256

/** Zona (px) desde el borde del scroller que activa auto-scroll. */
export const DRAG_SCROLL_EDGE_PX = 96

/** Velocidad máx. de auto-scroll (px / frame aprox.). */
export const DRAG_SCROLL_MAX_SPEED = 28

/**
 * Busca el scroller vertical real.
 * Prioriza [data-slot="scroll-area"] (AppListScroll / ScrollArea nativo).
 */
export function findVerticalScrollParent(
  start: HTMLElement | null,
): HTMLElement | null {
  let node: HTMLElement | null = start

  while (node && node !== document.body) {
    if (node.getAttribute("data-slot") === "scroll-area") {
      return node
    }

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
 * Auto-scroll en bordes. `bottomInset` reserva el bottom-nav en móvil
 * para que la zona activa quede por encima de la barra.
 */
export function autoScrollAtPointer(
  clientY: number,
  scrollParent: HTMLElement | null,
  opts?: {
    edgePx?: number
    maxSpeed?: number
    bottomInset?: number
  },
): boolean {
  if (!scrollParent) return false

  const edgePx = opts?.edgePx ?? DRAG_SCROLL_EDGE_PX
  const maxSpeed = opts?.maxSpeed ?? DRAG_SCROLL_MAX_SPEED
  const bottomInset = opts?.bottomInset ?? 0

  const rect = scrollParent.getBoundingClientRect()
  const topZone = rect.top + edgePx
  // Efectivo: no contar el área tapada por bottom-nav
  const effectiveBottom = Math.min(rect.bottom, window.innerHeight - bottomInset)
  const bottomZone = effectiveBottom - edgePx

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

/** top del overlay: por encima del dedo. */
export function overlayTopAbovePointer(clientY: number): number {
  return Math.max(8, clientY - DRAG_OVERLAY_CLEARANCE_PX)
}

/**
 * left del overlay.
 * - Móvil: a la DERECHA del dedo (si cabe); si no, a la izquierda.
 * - Desktop: respeta preferredLeft (alineado a la fila) o puntero + 14.
 */
export function overlayLeftBesidePointer(
  clientX: number,
  opts?: {
    isMobile?: boolean
    preferredLeft?: number
    width?: number
  },
): number {
  const width = opts?.width ?? DRAG_OVERLAY_WIDTH_PX
  const gap = 16
  const margin = 8

  if (!opts?.isMobile) {
    if (typeof opts?.preferredLeft === "number") {
      return opts.preferredLeft
    }
    return clientX + 14
  }

  // Móvil: preferir derecha del dedo
  const right = clientX + gap
  if (right + width <= window.innerWidth - margin) {
    return right
  }
  // Flip a la izquierda del dedo
  return Math.max(margin, clientX - width - gap)
}

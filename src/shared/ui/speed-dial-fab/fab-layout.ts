/**
 * Contrato de capas mobile (viewport fixed / portal a body):
 *
 *   panel de contenido (shell)     → se traslada con el drawer
 *   FAB                            → z-30  (este módulo)
 *   bottomsheet / dialog overlay   → z-40+
 *   toasts                         → por encima
 *
 * El FAB NUNCA debe ir a z ≥ 40: taparía el sheet que abren sus acciones.
 */

/** Separación desde el borde derecho del FAB. */
export const FAB_RIGHT_OFFSET_PX = 16

/** Capa del FAB: debajo de popover-sheet / dialog (z-40). */
export const FAB_Z_CLASS = "z-30"

/** Alineado con PANEL_TRANSITION del CompactShell. */
export const FAB_CHROME_FADE_MS = 280

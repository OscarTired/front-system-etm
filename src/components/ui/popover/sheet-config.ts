export const SHEET_CONFIG = {
  DISMISS_THRESHOLD_PX: 90,
  DISMISS_VELOCITY_THRESHOLD: 0.5,
  ANIMATION_DURATION_MS: 250,
  UNMOUNT_BUFFER_MS: 20,
  EASING_DISMISS: "cubic-bezier(0.32, 0.72, 0, 1)",
  EASING_RESET: "cubic-bezier(0.16, 1, 0.3, 1)",
  SAFE_AREA_BOTTOM_OFFSET_PX: 14,
  /**
   * Altura FIJA del sheet, siempre — nunca se recalcula por
   * contenido (buscar y tener 1 resultado no lo achica) ni por el
   * teclado (ya está pensada para sobrar por encima de un teclado
   * normal). Cero JS midiendo nada: un solo número.
   */
  FIXED_HEIGHT_RATIO: 0.9,
} as const

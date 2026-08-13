export const SHEET_CONFIG = {
  DISMISS_THRESHOLD_PX: 90,
  DISMISS_VELOCITY_THRESHOLD: 0.5,
  ANIMATION_DURATION_MS: 250,
  UNMOUNT_BUFFER_MS: 20,
  EASING_DISMISS: "cubic-bezier(0.32, 0.72, 0, 1)",
  EASING_RESET: "cubic-bezier(0.16, 1, 0.3, 1)",
  SAFE_AREA_BOTTOM_OFFSET_PX: 14,
  /**
   * En reposo (input de búsqueda sin foco): el sheet se achica al
   * contenido, con este tope — como un sheet normal.
   */
  MAX_HEIGHT_RATIO: 0.85,
  /**
   * Con el input de búsqueda enfocado: altura FIJA, siempre — no se
   * recalcula por cuánto contenido tenga (buscar y tener 1
   * resultado no lo achica). Pensada para sobrar por encima de un
   * teclado normal. Cero JS midiendo el teclado: un solo número.
   */
  FIXED_HEIGHT_RATIO: 0.9,
} as const

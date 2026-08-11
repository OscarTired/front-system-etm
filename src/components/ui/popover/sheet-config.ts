export const SHEET_CONFIG = {
  DISMISS_THRESHOLD_PX: 90,
  DISMISS_VELOCITY_THRESHOLD: 0.5,
  ANIMATION_DURATION_MS: 250,
  UNMOUNT_BUFFER_MS: 20,
  EASING_DISMISS: "cubic-bezier(0.32, 0.72, 0, 1)",
  EASING_RESET: "cubic-bezier(0.16, 1, 0.3, 1)",
  SAFE_AREA_BOTTOM_OFFSET_PX: 14,
  /** Tope del sheet respecto al alto visible del visualViewport */
  MAX_HEIGHT_RATIO: 0.85,
} as const

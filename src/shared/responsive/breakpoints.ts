// shared/responsive/breakpoints.ts

// Única fuente de verdad. Todo el sistema (Tailwind config,
// ResponsiveProvider, detección server-side) lee de acá.
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
  wide: 1536,
} as const

export type BreakpointName = keyof typeof BREAKPOINTS

export const BREAKPOINT_ORDER: BreakpointName[] = [
  "mobile",
  "tablet",
  "laptop",
  "desktop",
  "wide",
]

/**
 * Alto máximo que sigue contando como "teléfono en landscape".
 * iPhone 14 Pro Max landscape ≈ 430px; iPad portrait ≈ 768+.
 * Por debajo de esto + ancho < laptop → shell móvil (TopBar + bottom nav).
 */
export const PHONE_LANDSCAPE_MAX_HEIGHT_PX = 500

// Dado un ancho en px, devuelve el breakpoint activo (CSS / grids).
export function resolveBreakpoint(width: number): BreakpointName {
  let current: BreakpointName = "mobile"

  for (const name of BREAKPOINT_ORDER) {
    if (width >= BREAKPOINTS[name]) {
      current = name
    }
  }

  return current
}

/**
 * Shell de teléfono (chrome compacto), no el breakpoint CSS.
 * - Portrait / angosto: width < tablet
 * - Landscape en phone: height bajo + width aún < laptop
 *   (si no, un iPhone horizontal se veía como tablet/desktop).
 */
export function resolveIsMobileShell(width: number, height: number): boolean {
  if (width < BREAKPOINTS.tablet) return true
  if (height < PHONE_LANDSCAPE_MAX_HEIGHT_PX && width < BREAKPOINTS.laptop) {
    return true
  }
  return false
}

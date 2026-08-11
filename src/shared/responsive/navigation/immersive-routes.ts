/**
 * Rutas mobile "immersive": el shell no scrollea y deja un
 * slot con altura real (absolute top-14 / bottom-20) para tools a
 * pantalla completa (canvas, editores, etc.).
 *
 * Para agregar otra: sumar el prefix acá. El page de esa ruta debe
 * llenar el slot con `absolute inset-0` (ver nesting/page.tsx).
 */
export const IMMERSIVE_ROUTE_PREFIXES = ["/nesting"] as const

export function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Alturas del chrome mobile (top bar + bottom nav). Útil si un page
 *  necesita calc() fuera del slot immersive. */
export const MOBILE_TOP_BAR_PX = 56 // 3.5rem = top-14
export const MOBILE_BOTTOM_NAV_PX = 80 // ~ bottom-20

import {
  TOP_BAR_HEIGHT_PX,
  BOTTOM_NAV_HEIGHT_PX,
} from "@/shared/responsive/layout/chrome-constants"

export const IMMERSIVE_ROUTE_PREFIXES = ["/nesting"] as const

export function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

// Re-exportadas para no romper a quien ya las importaba desde acá —
// la fuente real ahora vive en chrome-constants.ts.
export { TOP_BAR_HEIGHT_PX as MOBILE_TOP_BAR_PX }
export { BOTTOM_NAV_HEIGHT_PX as MOBILE_BOTTOM_NAV_PX }
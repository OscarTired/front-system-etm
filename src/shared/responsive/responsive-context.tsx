"use client"

import { createContext, useEffect, useState } from "react"

import {
  BREAKPOINTS,
  resolveBreakpoint,
  resolveIsMobileShell,
  type BreakpointName,
} from "./breakpoints"

export type ResponsiveState = {
  breakpoint: BreakpointName
  /** Shell compacto: TopBar + bottom nav + FAB. Incluye phone landscape. */
  isMobile: boolean
  isTablet: boolean
  isLaptop: boolean
  isDesktop: boolean
  isWide: boolean
  /** mobile shell o tablet (ancho). */
  isCompact: boolean
  ready: boolean
}

export const ResponsiveContext =
  createContext<ResponsiveState | null>(null)

function buildState(
  breakpoint: BreakpointName,
  isMobileShell: boolean,
  ready: boolean,
): ResponsiveState {
  return {
    breakpoint,
    isMobile: isMobileShell,
    isTablet: breakpoint === "tablet" && !isMobileShell,
    isLaptop: breakpoint === "laptop",
    isDesktop: breakpoint === "desktop",
    isWide: breakpoint === "wide",
    isCompact: isMobileShell || breakpoint === "tablet",
    ready,
  }
}

type Props = {
  initialBreakpoint: BreakpointName
  children: React.ReactNode
}

export function ResponsiveProvider({
  initialBreakpoint,
  children,
}: Props) {
  // SSR / primer paint: el UA ya eligió breakpoint; isMobile
  // coincide con "mobile" hasta hidratar (landscape se corrige al instante).
  const [breakpoint, setBreakpoint] =
    useState<BreakpointName>(initialBreakpoint)
  const [isMobileShell, setIsMobileShell] = useState(
    initialBreakpoint === "mobile",
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const recompute = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setBreakpoint(resolveBreakpoint(w))
      setIsMobileShell(resolveIsMobileShell(w, h))
      setReady(true)
    }

    recompute()

    // min-width (breakpoint CSS) + resize (altura al rotar).
    const queries = (Object.keys(BREAKPOINTS) as BreakpointName[]).map(
      name => ({
        name,
        mql: window.matchMedia(`(min-width: ${BREAKPOINTS[name]}px)`),
      }),
    )

    queries.forEach(({ mql }) => {
      mql.addEventListener("change", recompute)
    })
    window.addEventListener("resize", recompute)
    // iOS a veces solo dispara orientationchange al girar.
    window.addEventListener("orientationchange", recompute)

    return () => {
      queries.forEach(({ mql }) => {
        mql.removeEventListener("change", recompute)
      })
      window.removeEventListener("resize", recompute)
      window.removeEventListener("orientationchange", recompute)
    }
  }, [])

  const state = buildState(breakpoint, isMobileShell, ready)

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  )
}

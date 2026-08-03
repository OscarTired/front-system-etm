"use client"

import { createContext, useEffect, useState } from "react"

import {
  BREAKPOINTS,
  resolveBreakpoint,
  type BreakpointName,
} from "./breakpoints"

export type ResponsiveState = {
  breakpoint: BreakpointName
  isMobile: boolean
  isTablet: boolean
  isLaptop: boolean
  isDesktop: boolean
  isWide: boolean
  isCompact: boolean
  ready: boolean
}

export const ResponsiveContext =
  createContext<ResponsiveState | null>(null)

function buildState(breakpoint: BreakpointName, ready: boolean): ResponsiveState {
  return {
    breakpoint,
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isLaptop: breakpoint === "laptop",
    isDesktop: breakpoint === "desktop",
    isWide: breakpoint === "wide",
    isCompact: breakpoint === "mobile" || breakpoint === "tablet",
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
  const [breakpoint, setBreakpoint] =
    useState<BreakpointName>(initialBreakpoint)

  const [ready, setReady] = useState(false)

  useEffect(() => {
    const queries = (Object.keys(BREAKPOINTS) as BreakpointName[]).map(
      name => ({
        name,
        mql: window.matchMedia(`(min-width: ${BREAKPOINTS[name]}px)`),
      }),
    )

    const recompute = () => {
      setBreakpoint(resolveBreakpoint(window.innerWidth))
      setReady(true)
    }

    recompute()

    queries.forEach(({ mql }) => {
      mql.addEventListener("change", recompute)
    })

    return () => {
      queries.forEach(({ mql }) => {
        mql.removeEventListener("change", recompute)
      })
    }
  }, [])

  const state = buildState(breakpoint, ready)

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  )
}
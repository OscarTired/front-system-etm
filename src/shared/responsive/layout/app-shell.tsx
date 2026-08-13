"use client"

import { useEffect, type ReactNode } from "react"
import { FocusNavOverlay } from "@/shared/focus/focus-nav-overlay"
import { usePathname, useSearchParams } from "next/navigation"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { isImmersiveRoute } from "@/shared/responsive/navigation/immersive-routes"
import { TOP_BAR_HEIGHT_PX, BOTTOM_NAV_HEIGHT_PX } from "./chrome-constants"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"

type Props = {
  children: ReactNode
}

function DesktopTopBar() {
  return (
    <div className="flex h-9 shrink-0 items-center px-3">
      <SidebarShowButton />
    </div>
  )
}

const CURVE_RADIUS = 28
const CURVE_ROUNDED = `${CURVE_RADIUS}px 0px 0px ${CURVE_RADIUS}px`
const CURVE_SQUARE = "0px 0px 0px 0px"
const TRANSITION_TIMING = "300ms ease-out"
const DRAWER_WIDTH_PX = 248
const PANEL_TRANSITION = "transform 280ms ease-out, border-radius 280ms ease-out"

function DesktopShell({ children }: Props) {
  const visualState = useSidebarStore(state => state.visualState)
  const notifyClipTransitionEnd = useSidebarStore(
    state => state.notifyClipTransitionEnd,
  )

  const borderRadius =
    visualState === "hidden" || visualState === "curve-closing"
      ? CURVE_SQUARE
      : CURVE_ROUNDED

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName === "border-radius") {
      notifyClipTransitionEnd()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sidebar text-foreground">
      <AppSidebar />
      <main
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background"
        style={{
          borderRadius,
          transition: `border-radius ${TRANSITION_TIMING}`,
        }}
      >
        <DesktopTopBar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const isOpen = mode === "open"
  const immersive = isImmersiveRoute(pathname)

  useEffect(() => {
    closeDrawer()
  }, [pathname, searchKey, closeDrawer])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, closeDrawer])

  return (
    <div className="relative h-dvh overflow-hidden bg-sidebar text-foreground select-none">
      <div
        className="absolute inset-y-0 left-0 z-0"
        style={{ width: DRAWER_WIDTH_PX }}
        aria-hidden={!isOpen}
      >
        <AppSidebar variant="drawer" open={isOpen} />
      </div>

      <div
        className="absolute inset-0 z-10 overflow-hidden bg-background"
        style={{
          transform: isOpen
            ? `translate3d(${DRAWER_WIDTH_PX}px, 0, 0)`
            : "translate3d(0px, 0, 0)",
          borderRadius: isOpen ? CURVE_ROUNDED : CURVE_SQUARE,
          transition: PANEL_TRANSITION,
          willChange: isOpen ? "transform" : "auto",
        }}
      >

        <TopBar />

        {immersive ? (
          <div
            data-immersive-slot
            className="absolute inset-x-0 z-10 overflow-hidden"
            style={{
              top: TOP_BAR_HEIGHT_PX,
              bottom: BOTTOM_NAV_HEIGHT_PX,
            }}
          >
            {children}
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden">
            {children}
          </div>
        )}

        <BottomNavigation />

        {isOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-x-0 top-14 bottom-0 z-30 cursor-default"
            onClick={closeDrawer}
          />
        )}
      </div>
    </div>
  )
}

export function AppShell({ children }: Props) {
  const { isMobile, ready } = useResponsive()

  if (!ready) {
    return <div className="h-full bg-background" />
  }

  const shell = isMobile ? (
    <CompactShell>{children}</CompactShell>
  ) : (
    <DesktopShell>{children}</DesktopShell>
  )

  return (
    <>
      {shell}
      <FocusNavOverlay />
    </>
  )
}
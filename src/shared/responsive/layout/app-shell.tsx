"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { isImmersiveRoute } from "@/shared/responsive/navigation/immersive-routes"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { PullToRefresh } from "../mobile/pull-to-refresh"

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

/**
 * Modelo B — el shell NO scrollea.
 * Una sola fuente de scroll vive en la página (VerticalScroll en la lista).
 * El shell solo aporta chrome + slot con altura acotada (min-h-0 / overflow-hidden).
 */
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
    <div className="flex h-screen overflow-hidden bg-[#1d1c1c] text-white">
      <AppSidebar />
      <main
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#050505]"
        style={{
          borderRadius,
          transition: `border-radius ${TRANSITION_TIMING}`,
        }}
      >
        <DesktopTopBar />
        {/* Slot de página: sin overflow-y. La lista scrollea adentro. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Mobile shell.
 *
 * - Drawer: translate3d del panel (GPU).
 * - Immersive: slot fijo top-14 / bottom-20.
 * - Resto: PTR + slot sin scroll propio. VerticalScroll vive en la página.
 */
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
    <div className="relative h-dvh overflow-hidden bg-[#1d1c1c] text-white select-none">
      <div
        className="absolute inset-y-0 left-0 z-0"
        style={{ width: DRAWER_WIDTH_PX }}
        aria-hidden={!isOpen}
      >
        <AppSidebar variant="drawer" open={isOpen} />
      </div>

      <div
        className="absolute inset-0 z-10 overflow-hidden bg-[#050505]"
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
            className="absolute inset-x-0 top-14 bottom-20 z-10 overflow-hidden"
          >
            {children}
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex min-h-0 flex-col pt-14 pb-20">
            {/*
              PTR envuelve el slot. El scroller real es VerticalScroll
              dentro de la página ([data-vertical-scroll-container]).
            */}
            <PullToRefresh>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {children}
              </div>
            </PullToRefresh>
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
    return <div className="h-full bg-[#050505]" />
  }

  if (isMobile) {
    return <CompactShell>{children}</CompactShell>
  }

  return <DesktopShell>{children}</DesktopShell>
}

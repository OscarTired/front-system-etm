"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { isImmersiveRoute } from "@/shared/responsive/navigation/immersive-routes"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"
import { useClampScroll } from "@/shared/ui/vertical-scroll/use-clamp-scroll"
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

/** Margen de flechas respecto al slot de contenido (chrome ya va en pt/pb). */
const CONTENT_ARROW_INSET = 10

function DesktopShell({ children }: Props) {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Origen del hueco: scrollTop > maxScroll cuando el contenido encoge.
  useClampScroll(scrollRef)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [pathname])

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
        <div
          ref={scrollRef}
          className="hide-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
          data-desktop-scroll
        >
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Mobile shell.
 *
 * - Drawer reveal: solo translate3d del panel (GPU). Menú estático detrás.
 * - Rutas immersive: slot con altura real (top-14 / bottom-20).
 * - Resto: VerticalScroll + pull-to-refresh.
 *   Las flechas se anclan al slot de contenido (ya sin chrome), no al dvh.
 */
function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const isOpen = mode === "open"
  const immersive = isImmersiveRoute(pathname)

  // Pathname O query (procesos ?code=): cierra al navegar, sin pasarse de fase.
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
        className="absolute inset-0 z-10 overflow-hidden bg-[#050505] contain-[layout_paint]"
        style={{
          // Solo 0 o DRAWER_WIDTH — sin valores intermedios en JS que
          // puedan dejar el panel “pasado” del cierre tras un reflow
          // (row expandido / cambio de ruta a mitad de la transición).
          transform: isOpen
            ? `translate3d(${DRAWER_WIDTH_PX}px, 0, 0)`
            : "translate3d(0px, 0, 0)",
          borderRadius: isOpen ? CURVE_ROUNDED : CURVE_SQUARE,
          transition: isOpen
            ? PANEL_TRANSITION
            : PANEL_TRANSITION,
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
            <PullToRefresh>
              <VerticalScroll
                resetKey={pathname}
                containerClassName="h-full min-h-0"
                className="overflow-x-hidden"
                arrowTopOffset={CONTENT_ARROW_INSET}
                arrowBottomOffset={CONTENT_ARROW_INSET}
              >
                {children}
              </VerticalScroll>
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
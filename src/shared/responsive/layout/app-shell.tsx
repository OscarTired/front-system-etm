"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"
import { PullToRefresh } from "../mobile/pull-to-refresh"

type Props = {
  children: ReactNode
}

function DesktopTopBar() {
  return (
    <div className="flex h-12 shrink-0 items-center px-3">
      <SidebarShowButton />
    </div>
  )
}

const CURVE_RADIUS = 28
const CURVE_ROUNDED = `${CURVE_RADIUS}px 0px 0px ${CURVE_RADIUS}px`
const CURVE_SQUARE = "0px 0px 0px 0px"
const TRANSITION_TIMING = "300ms cubic-bezier(.22,1,.36,1)"

/** Ancho del menú revelado (mismo que el aside del drawer). */
const DRAWER_WIDTH_PX = 248

/**
 * Solo transform (capa del compositor). Sin spring, sin motion value,
 * sin interpolar border-radius por frame.
 */
const PANEL_TRANSITION =
  "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)"

function DesktopShell({ children }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-desktop-scroll]")
    if (el) el.scrollTop = 0
  }, [pathname])

  const visualState = useSidebarStore((state) => state.visualState)
  const notifyClipTransitionEnd = useSidebarStore(
    (state) => state.notifyClipTransitionEnd,
  )

  const borderRadius =
    visualState === "hidden" || visualState === "curve-closing"
      ? CURVE_SQUARE
      : CURVE_ROUNDED

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>,
  ) => {
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
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#050505] will-change-[border-radius]"
        style={{
          borderRadius,
          transition: `border-radius ${TRANSITION_TIMING}`,
        }}
      >
        <DesktopTopBar />
        <div
          className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          data-desktop-scroll
        >
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Mismo gesto visual de antes (el contenido se desplaza y deja ver el
 * menú debajo), pero barato:
 *
 * 1. El sidebar está estático detrás (no anima).
 * 2. Solo el panel de contenido usa `translate3d` (GPU).
 * 3. `border-radius` en dos estados (abierto/cerrado), no interpolado
 *    en cada frame con useTransform.
 * 4. CSS transition — sin spring ni animate() de motion en el hilo JS.
 */
function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore((s) => s.mode)
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  const isOpen = mode === "open"
  const isImmersive = pathname.startsWith("/nesting")

  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

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
      {/* Menú fijo detrás — no se anima */}
      <div
        className="absolute inset-y-0 left-0 z-0 w-[248px] max-w-[85vw]"
        style={{ width: DRAWER_WIDTH_PX }}
        aria-hidden={!isOpen}
      >
        <AppSidebar variant="drawer" open={isOpen} />
      </div>

      {/* Panel de app: solo translate3d + radius en 2 estados */}
      <div
        className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-[#050505]"
        style={{
          transform: isOpen
            ? `translate3d(${DRAWER_WIDTH_PX}px, 0, 0)`
            : "translate3d(0, 0, 0)",
          borderRadius: isOpen ? CURVE_ROUNDED : CURVE_SQUARE,
          transition: PANEL_TRANSITION,
          willChange: "transform",
        }}
      >
        {/* TopBar por encima del overlay para que el hamburger siga
            recibiendo el toggle (abrir/cerrar). */}
        <div className="relative z-30">
          <TopBar />
        </div>

        {isImmersive ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-14 pb-20">
            {children}
          </div>
        ) : (
          <PullToRefresh>
            <VerticalScroll
              resetKey={pathname}
              containerClassName="h-full"
              className="overflow-x-hidden pt-14 pb-20"
              arrowTopOffset={64}
              arrowBottomOffset={88}
            >
              {children}
            </VerticalScroll>
          </PullToRefresh>
        )}
        <BottomNavigation />

        {/* Cualquier toque en el panel (contenido / bottom nav) cierra.
            No usa pointer-events-none: si no, el click cae al vacío y
            no cierra. */}
        {isOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-x-0 top-14 bottom-0 z-20 cursor-default"
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

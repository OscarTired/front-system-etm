"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, animate, type PanInfo } from "motion/react"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar/sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { SidebarDrawer } from "@/shared/responsive/mobile/sidebar-drawer"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"
import { PullToRefresh } from "../mobile/pull-to-refresh"
import { cn } from "@/shared/utils/utils"

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

function DesktopShell({ children }: Props) {
  const pathname = usePathname()
  const visualState = useSidebarStore(state => state.visualState)
  const notifyClipTransitionEnd = useSidebarStore(
    state => state.notifyClipTransitionEnd,
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
        <div key={pathname} className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

// Configuración del drawer nativo
const DRAWER_REVEAL_OFFSET = 248

// Resorte para la interacción por botones (hamburguesa / click)
const BUTTON_SPRING = {
  type: "spring",
  stiffness: 350,
  damping: 35,
  mass: 0.3,
} as const

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)
  const openDrawer = useMobileNavStore(s => s.openDrawer)

  const isOpen = mode === "open"
  const x = useMotionValue(0)

  // Sincronización cuando se activa vía Botón (Hamburguesa/Chevron)
  useEffect(() => {
    const targetX = isOpen ? DRAWER_REVEAL_OFFSET : 0
    const controls = animate(x, targetX, BUTTON_SPRING)
    return () => controls.stop()
  }, [isOpen, x])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const currentX = x.get()
    const velocityX = info.velocity.x

    // 1. Proyectamos dónde terminaría el panel según la velocidad real del usuario
    const projectedX = currentX + velocityX * 0.15

    // 2. Decisión lógica basada en proyección e inercia
    const shouldBeOpen = projectedX > DRAWER_REVEAL_OFFSET / 2
    const targetX = shouldBeOpen ? DRAWER_REVEAL_OFFSET : 0

    // 3. Sincronizamos el store de Zustand de inmediato
    if (shouldBeOpen && !isOpen) {
      openDrawer()
    } else if (!shouldBeOpen && isOpen) {
      closeDrawer()
    }

    // 4. Continuación fluida: animate conserva la velocidad inicial del gesto (velocityX)
    animate(x, targetX, {
      type: "spring",
      velocity: velocityX,
      stiffness: 300,
      damping: 32,
      mass: 0.2,
    })
  }

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: "pan-y" }}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] will-change-transform"
      >
        <TopBar />
        <div
          inert={isOpen}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isOpen && "pointer-events-none select-none"
          )}
        >
          <PullToRefresh>
            <VerticalScroll
              key={pathname}
              containerClassName="h-full"
              className="overflow-x-hidden pt-14 pb-20"
              arrowTopOffset={64}
              arrowBottomOffset={88}
            >
              {children}
            </VerticalScroll>
          </PullToRefresh>
          <BottomNavigation />
        </div>
      </motion.div>
    </div>
  )
}

export function AppShell({ children }: Props) {
  const { isMobile, ready } = useResponsive()

  if (!ready) {
    return <div className="h-full bg-[#050505]" />
  }

  if (isMobile) {
    return (
      <CompactShell>
        {children}
      </CompactShell>
    )
  }

  return (
    <DesktopShell>
      {children}
    </DesktopShell>
  )
}
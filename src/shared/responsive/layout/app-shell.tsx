"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type Variants,
  type Transition,
} from "motion/react"

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

/* ==========================================================================
   DESKTOP SHELL
   ========================================================================== */

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
  const visualState = useSidebarStore((state) => state.visualState)
  const notifyClipTransitionEnd = useSidebarStore(
    (state) => state.notifyClipTransitionEnd
  )

  const borderRadius =
    visualState === "hidden" || visualState === "curve-closing"
      ? CURVE_SQUARE
      : CURVE_ROUNDED

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>
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
          key={pathname}
          className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          {children}
        </div>
      </main>
    </div>
  )
}

/* ==========================================================================
   COMPACT SHELL (MOBILE - ULTRA FLUID 60 FPS / iOS PHYSICS)
   ========================================================================== */

const DRAWER_REVEAL_OFFSET = 248
const CLOSE_THRESHOLD_RATIO = 0.35
const FLICK_VELOCITY_THRESHOLD = 350

// Curva de transición estilo Apple UIKit (System Curve)
const IOS_TRANSITION = {
  type: "tween",
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1],
} as const satisfies Transition

// Contrato de Variantes fuertemente tipado para evitar 'Type widening' en Vercel Build
export const drawerVariants = {
  closed: {
    x: 0,
    transition: IOS_TRANSITION,
  },
  open: {
    x: DRAWER_REVEAL_OFFSET,
    transition: IOS_TRANSITION,
  },
} satisfies Variants

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore((s) => s.mode)
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  // Motion Value primario directamente en GPU
  const x = useMotionValue(0)
  const isOpen = mode === "open"
  const isDraggingRef = useRef(false)

  // Transformaciones reactivas fuera del loop de renders de React
  const backdropOpacity = useTransform(
    x,
    [0, DRAWER_REVEAL_OFFSET],
    [0, 0.45]
  )
  const shadowOpacity = useTransform(
    x,
    [0, DRAWER_REVEAL_OFFSET],
    [0, 0.25]
  )

  // Control programático (Sincronización cuando cambia el store por clics)
  useEffect(() => {
    if (isDraggingRef.current) return

    const targetX = isOpen ? DRAWER_REVEAL_OFFSET : 0
    const controls = animate(x, targetX, IOS_TRANSITION)

    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh w-full overflow-hidden select-none bg-[#1d1c1c] text-white">
      {/* Drawer Inferior */}
      <SidebarDrawer />

      {/* Overlay Oscuro Dinámico */}
      <motion.div
        style={{ opacity: backdropOpacity }}
        onClick={closeDrawer}
        className={cn(
          "fixed inset-0 z-10 bg-black pointer-events-none transition-pointer-events",
          isOpen && "pointer-events-auto"
        )}
      />

      {/* Tarjeta Principal Interactiva */}
      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true
        }}
        onDragEnd={async (_event, info) => {
          const currentX = x.get()
          const velocityX = info.velocity.x

          // Proyección de inercia para predecir la intención del usuario
          const projectedX = currentX + velocityX * 0.1
          const isFlickLeft = velocityX < -FLICK_VELOCITY_THRESHOLD
          const isFlickRight = velocityX > FLICK_VELOCITY_THRESHOLD

          let shouldClose = false

          if (isFlickLeft) {
            shouldClose = true
          } else if (isFlickRight) {
            shouldClose = false
          } else {
            shouldClose = projectedX < DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          }

          x.stop()

          if (shouldClose) {
            await animate(x, 0, IOS_TRANSITION)
            closeDrawer()
          } else {
            animate(x, DRAWER_REVEAL_OFFSET, IOS_TRANSITION)
          }

          isDraggingRef.current = false
        }}
        style={{
          x,
          touchAction: "pan-y",
          willChange: "transform",
          transformTemplate: ({ x }: { x: string | number }) =>
            `translate3d(${typeof x === "number" ? `${x}px` : x}, 0, 0)`,
        }}
        className="absolute inset-0 z-20 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] shadow-2xl"
      >
        {/* Sombra Lateral Dinámica */}
        <motion.div
          style={{ opacity: shadowOpacity }}
          className="pointer-events-none absolute -left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/80"
        />

        <TopBar />

        {/* Isolation Boundary (Aísla reflows internos durante el gesto) */}
        <div
          inert={isOpen}
          style={{ contain: "strict" }}
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-opacity duration-200",
            isOpen && "pointer-events-none select-none opacity-90"
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

/* ==========================================================================
   MAIN APP SHELL ROUTER
   ========================================================================== */

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

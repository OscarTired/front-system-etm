"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, animate } from "motion/react"

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

const DRAWER_REVEAL_OFFSET = 248
const CLOSE_THRESHOLD_RATIO = 0.25
const FLICK_VELOCITY_THRESHOLD = 500

const SMOOTH_TRANSITION = {
  type: "tween",
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
} as const

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const x = useMotionValue(0)
  const isOpen = mode === "open"
  const selfAnimatedCloseRef = useRef(false)

  // Controla la activación del clipPath/bordes SOLO al terminar el cierre
  const [applyClipPath, setApplyClipPath] = useState(false)

  useEffect(() => {
    if (selfAnimatedCloseRef.current) {
      selfAnimatedCloseRef.current = false
      return
    }

    if (isOpen) {
      setApplyClipPath(false)
    }

    const controls = animate(x, isOpen ? DRAWER_REVEAL_OFFSET : 0, {
      ...SMOOTH_TRANSITION,
      onComplete: () => {
        // Al terminar de cerrar programáticamente (botón), aplicamos el clipPath
        if (!isOpen) {
          setApplyClipPath(true)
        }
      },
    })
    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          setApplyClipPath(false)
        }}
        onDragEnd={async (_event, info) => {
          const currentX = x.get()
          const closeThreshold = DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          const isFastFlickLeft = info.velocity.x < -FLICK_VELOCITY_THRESHOLD
          const shouldClose = currentX < closeThreshold || isFastFlickLeft

          x.stop()

          if (shouldClose) {
            selfAnimatedCloseRef.current = true
            // 1. Espera a que el deslizamiento físico termine en x = 0
            await animate(x, 0, SMOOTH_TRANSITION)
            // 2. Solo al final de todo el movimiento aplicamos el recorte/curva
            setApplyClipPath(true)
            closeDrawer()
          } else {
            animate(x, DRAWER_REVEAL_OFFSET, SMOOTH_TRANSITION)
          }
        }}
        style={{
          x,
          touchAction: "pan-y",
          borderTopLeftRadius: applyClipPath ? CURVE_RADIUS : 0,
          borderBottomLeftRadius: applyClipPath ? CURVE_RADIUS : 0,
        }}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505] will-change-transform"
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

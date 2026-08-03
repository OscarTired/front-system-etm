"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useAnimationControls, type PanInfo } from "motion/react"

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

const CURVE_ROUNDED = "28px 0px 0px 28px"
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

// --- Configuración Mobile Drawer estilo iOS ---
const DRAWER_REVEAL_OFFSET = 248
const SWIPE_THRESHOLD = 80

const drawerVariants = {
  closed: { 
    x: 0, 
    transition: { type: "spring", stiffness: 400, damping: 40 } 
  },
  open: { 
    x: DRAWER_REVEAL_OFFSET, 
    transition: { type: "spring", stiffness: 400, damping: 40 } 
  },
}

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)
  const openDrawer = useMobileNavStore(s => s.openDrawer)
  const controls = useAnimationControls()

  const isOpen = mode === "open"

  useEffect(() => {
    controls.start(isOpen ? "open" : "closed")
  }, [isOpen, controls])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (isOpen) {
      if (offset < -SWIPE_THRESHOLD || velocity < -300) {
        closeDrawer()
      } else {
        controls.start("open", { velocity })
      }
    } else {
      if (offset > SWIPE_THRESHOLD || velocity > 300) {
        openDrawer()
      } else {
        controls.start("closed", { velocity })
      }
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0.05}
        dragSnapToOrigin={false}
        animate={controls}
        initial={isOpen ? "open" : "closed"}
        variants={drawerVariants}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505] touch-pan-y will-change-transform"
      >
        <TopBar />
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-opacity duration-200",
            isOpen && "pointer-events-none opacity-90"
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
    return <CompactShell>{children}</CompactShell>
  }

  return <DesktopShell>{children}</DesktopShell>
}

"use client"

import { type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, type Transition } from "motion/react"

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

const TRANSITION_TIMING = "300ms cubic-bezier(.22,1,.36,1)"

function DesktopShell({ children }: Props) {
  const pathname = usePathname()
  const visualState = useSidebarStore((state) => state.visualState)
  const notifyClipTransitionEnd = useSidebarStore((state) => state.notifyClipTransitionEnd)

  const isCurve = visualState !== "hidden" && visualState !== "curve-closing"
  const borderRadius = isCurve ? "28px 0px 0px 28px" : "0px"

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "border-radius") {
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

/* ==========================================================================
   COMPACT SHELL (MOBILE)
   ========================================================================== */

const DRAWER_REVEAL_OFFSET = 248

const SPRING_TRANSITION: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 200,
  mass: 0.8,
}

function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore((s) => s.mode)
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  const isOpen = mode === "open"

  return (
    <div className="relative h-dvh w-full overflow-hidden select-none bg-[#1d1c1c] text-white">
      {/* Drawer Inferior */}
      <SidebarDrawer />

      {/* Overlay Oscuro Dinámico */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-10 bg-black pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Tarjeta Principal Interactiva */}
      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          const isFlickLeft = info.velocity.x < -300
          const isDraggedFarEnough = info.offset.x < -60
          
          if (isFlickLeft || isDraggedFarEnough) {
            closeDrawer()
          }
        }}
        initial={false}
        animate={{ x: isOpen ? DRAWER_REVEAL_OFFSET : 0 }}
        transition={SPRING_TRANSITION}
        className="absolute inset-0 z-20 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] shadow-2xl touch-pan-y"
      >
        {/* Sombra Lateral Dinámica */}
        <motion.div
          animate={{ opacity: isOpen ? 0.25 : 0 }}
          className="pointer-events-none absolute -left-8 top-0 bottom-0 w-8 bg-linear-to-r from-transparent to-black"
        />

        <TopBar />

        {/* Contenido Principal */}
        <div
          inert={isOpen}
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-opacity duration-200",
            isOpen && "opacity-90 pointer-events-none"
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
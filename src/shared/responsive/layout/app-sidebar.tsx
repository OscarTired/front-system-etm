// app-sidebar.tsx
"use client"

import { useState } from "react"
import { ProfileDialog } from "@/features/profile"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { cn } from "@/shared/utils/utils"

import { useSidebarCounts } from "./hooks/use-sidebar-counts"
import { useSidebarPrefetch } from "./hooks/use-sidebar-prefetch"
import { useProfilePanel } from "./hooks/use-profile-panel"
import { SidebarHeader } from "./sidebar/sidebar-header"
import { SidebarNavigation } from "./sidebar/sidebar-navigation"
import { SidebarProfile } from "./sidebar/sidebar-profile"

type Props = {
  variant?: "desktop" | "drawer"
  open?: boolean
}

const SIDEBAR_ASIDE_COLLAPSED_WIDTH = 72
const SIDEBAR_ASIDE_OPEN_WIDTH = 248

export function AppSidebar({
  variant = "desktop",
  open = false,
}: Props = {}) {
  const mode = useSidebarStore(s => s.mode)
  const lastVisibleMode = useSidebarStore(s => s.lastVisibleMode)
  const visualState = useSidebarStore(s => s.visualState)
  const notifyContentTransitionEnd = useSidebarStore(
    s => s.notifyContentTransitionEnd,
  )

  const visibleMode =
    mode === "closed"
      ? lastVisibleMode
      : mode

  const isDrawer = variant === "drawer"
  const collapsed = !isDrawer && visibleMode === "collapsed"

  const isVisible =
    isDrawer
      ? open
      : visualState === "visible" || visualState === "moving-in"

  const isFullyHidden = !isDrawer && visualState === "hidden"

  // Modo drawer: el sidebar ya NO anima nada propio — está ahí,
  // estático, siempre en su lugar. Lo que se ve/oculta es el
  // CONTENIDO de arriba deslizándose por encima (CompactShell, un
  // solo `motion.div`, un solo lugar animando). Sin nada propio que
  // animar acá, no hay dos animaciones que puedan desincronizarse —
  // no por sincronizarlas mejor, sino porque ya no hay una segunda.
  // un drag, un botón, o algo a mitad de camino.
  // Fallback real (no un cast forzado) para cuando no viene motionX
  // (caso desktop, donde esta rama simplemente no se usa) — useTransform
  // necesita un MotionValue de verdad, siempre.
  const width =
    isDrawer
      ? undefined
      : visualState === "hidden" ||
        visualState === "moving-out" ||
        visualState === "curve-closing"
        ? 0
        : collapsed
        ? SIDEBAR_ASIDE_COLLAPSED_WIDTH
        : SIDEBAR_ASIDE_OPEN_WIDTH

  const [profileEditOpen, setProfileEditOpen] = useState(false)

  const {
    projectsCount,
    activeTasksCount,
    processCounts,
  } = useSidebarCounts()

  const { prefetchOnHover } = useSidebarPrefetch()

  const {
    profileOpen,
    setProfileOpen,
    toggleProfile,
    canOpenProfile,
    presenceCollapsed,
    presenceRef,
    panelHeight,
    containerRef,
    panelRef,
    contentRef,
    cardRef,
  } = useProfilePanel()

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>,
  ) => {
    if (isDrawer) return
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== "width") return

    notifyContentTransitionEnd()
  }

  return (
    <>
      <aside
        aria-hidden={isFullyHidden}
        onTransitionEnd={handleTransitionEnd}
        style={
          isDrawer
            ? { contain: "layout style" }
            : { width, contain: "layout style" }
        }
        className={cn(
          !isDrawer && "shrink-0",
          isDrawer && "absolute left-0 top-0 h-full w-62",
          "h-full",
          "isolate z-0 flex flex-col bg-[#1d1c1c] select-none",
          "overflow-hidden",
          "will-change-[width,transform]",
          // Desktop sigue con transición CSS propia. Drawer ya no
          // anima nada — está siempre ahí, estático; lo que se ve/
          // oculta es el contenido de arriba deslizándose por encima.
          !isDrawer && "transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          isDrawer && !isVisible && "pointer-events-none",
          isFullyHidden && "pointer-events-none",
        )}
      >
        {/* Contenedor interno con desvanecimiento suave de textos sincronizado */}
        <div 
          className={cn(
            "pt-6 pb-6 flex h-full flex-col overflow-hidden",
            "transition-all duration-200 ease-out",
            collapsed ? "opacity-95" : "opacity-100"
          )} 
          style={{ 
            width: isDrawer ? undefined : (collapsed ? SIDEBAR_ASIDE_COLLAPSED_WIDTH : SIDEBAR_ASIDE_OPEN_WIDTH),
            minWidth: SIDEBAR_ASIDE_COLLAPSED_WIDTH 
          }}
        >
          <SidebarHeader
            collapsed={collapsed}
            isDrawer={isDrawer}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SidebarNavigation
              collapsed={collapsed}
              isDrawer={isDrawer}
              projectsCount={projectsCount}
              activeTasksCount={activeTasksCount}
              processCounts={processCounts}
              presenceCollapsed={presenceCollapsed || collapsed}
              presenceRef={presenceRef}
              prefetchOnHover={prefetchOnHover}
            />
          </div>

          <div className="shrink-0 select-none p-3 pt-0 z-20">
            <SidebarProfile
              collapsed={collapsed}
              onEditProfile={() => setProfileEditOpen(true)}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              toggleProfile={toggleProfile}
              canOpenProfile={canOpenProfile}
              panelHeight={panelHeight}
              containerRef={containerRef}
              panelRef={panelRef}
              contentRef={contentRef}
              cardRef={cardRef}
            />
          </div>
        </div>
      </aside>

      <ProfileDialog
        open={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
      />
    </>
  )
}
// app-sidebar.tsx
"use client"

import { useState } from "react"
import type { MotionValue } from "motion/react"
import { motion, useMotionValue, useTransform } from "motion/react"
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
  /**
   * Modo drawer únicamente: el mismo motion value que mueve el
   * contenido por encima (CompactShell), con su rango [0, offset].
   * Sin esto, la revelación del sidebar dependía de su PROPIA
   * transición CSS por separado, atada solo a `open` — al cambiar
   * `mode` de golpe, el sidebar se escondía instantáneo mientras el
   * contenido de arriba todavía estaba a mitad de su animación,
   * dejando un hueco del fondo visible entre los dos. Derivarlo del
   * mismo valor lo hace imposible por construcción: van pegados
   * fotograma a fotograma, no dos animaciones que "deberían" coincidir.
   */
  motionX?: MotionValue<number>
  motionXRange?: [number, number]
}

const SIDEBAR_ASIDE_COLLAPSED_WIDTH = 72
const SIDEBAR_ASIDE_OPEN_WIDTH = 248

export function AppSidebar({
  variant = "desktop",
  open = false,
  motionX,
  motionXRange = [0, 248],
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

  // Derivados del MISMO motion value que el contenido — no una
  // transición CSS propia. min(1, x/offset) para el fade y el
  // translate, así el sidebar y el contenido siempre están
  // exactamente en el mismo punto del gesto, sin importar si viene de
  // un drag, un botón, o algo a mitad de camino.
  // Fallback real (no un cast forzado) para cuando no viene motionX
  // (caso desktop, donde esta rama simplemente no se usa) — useTransform
  // necesita un MotionValue de verdad, siempre.
  const fallbackX = useMotionValue(0)
  const effectiveX = motionX ?? fallbackX

  const drawerOpacity = useTransform(effectiveX, motionXRange, [0, 1])
  const drawerTranslatePercent = useTransform(effectiveX, motionXRange, ["-100%", "0%"])

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
      <motion.aside
        aria-hidden={isFullyHidden}
        onTransitionEnd={handleTransitionEnd}
        style={
          isDrawer
            ? { contain: "layout style", opacity: drawerOpacity, x: drawerTranslatePercent }
            : { width, contain: "layout style" }
        }
        className={cn(
          !isDrawer && "shrink-0",
          isDrawer && "absolute left-0 top-0 h-full w-62",
          "h-full",
          "isolate z-0 flex flex-col bg-[#1d1c1c] select-none",
          "overflow-hidden",
          "will-change-[width,transform,opacity]",
          // Desktop sigue con transición CSS propia (no depende de
          // ningún drag). Drawer ya no tiene transición CSS acá —
          // opacity/x vienen del style de arriba, derivados en tiempo
          // real del mismo motion value que mueve el contenido.
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

          <div className="shrink-0 select-none p-3 pt-0 overflow-hidden">
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
      </motion.aside>

      <ProfileDialog
        open={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
      />
    </>
  )
}
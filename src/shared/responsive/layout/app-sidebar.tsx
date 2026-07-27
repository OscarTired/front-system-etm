// app-sidebar.tsx
"use client"

import { useState } from "react"

import { ProfileDialog } from "@/features/profile"

import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { cn } from "@/shared/utils/utils"

import { useSidebarCounts } from "./hooks/use-sidebar-counts"
import { useSidebarPrefetch } from "./hooks/use-sidebar-prefetch"
import { useProfilePanel } from "./hooks/use-profile-panel"
import { SidebarHeader } from "./sidebar-header"
import { SidebarNavigation } from "./sidebar-navigation"
import { SidebarProfile } from "./sidebar-profile"

type Props = {
  variant?: "desktop" | "drawer"
  open?: boolean
}

export function AppSidebar({
  variant = "desktop",
  open = false,
}: Props = {}) {

  const mode = useSidebarStore(s => s.mode)
  const lastVisibleMode = useSidebarStore(s => s.lastVisibleMode)
  const visualState = useSidebarStore(s => s.visualState)

  const visibleMode =
    mode === "closed"
      ? lastVisibleMode
      : mode


  const isDrawer =
    variant === "drawer"


  const collapsed =
    !isDrawer &&
    visibleMode === "collapsed"


  // El shell desktop nunca se lee desde `mode` directamente: solo
  // `visualState` decide si el sidebar está mostrándose/moviéndose.
  const isVisible =
    isDrawer
      ? open
      : visualState === "visible" || visualState === "moving-in"

  const isFullyHidden =
    !isDrawer &&
    visualState === "hidden"


  const [profileEditOpen, setProfileEditOpen] = useState(false)


  const {
    projectsCount,
    activeTasksCount,
    processCounts,
  } = useSidebarCounts()


  const {
    prefetchOnHover,
  } = useSidebarPrefetch()


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


  return (
    <>

      <aside
        aria-hidden={isFullyHidden}
        className={cn(
          "absolute left-0 top-0 h-full",

          "isolate z-0 flex flex-col bg-[#1d1c1c] select-none",
          "overflow-hidden shrink-0",

          // 💡 Transición fluida con curva Bézier de Material 3 / Gemini (450ms):
          "transition-[width,transform] duration-450 ease-[cubic-bezier(0.2,0,0,1)]",

          collapsed
            ? "w-18"
            : "w-62",

          isVisible
            ? "translate-x-0"
            : "-translate-x-full",

          isFullyHidden && "pointer-events-none",
        )}
      >

        <div className="pt-6 pb-6 flex h-full flex-col">

          <SidebarHeader
            collapsed={collapsed}
            isDrawer={isDrawer}
          />

          <div className="flex min-h-0 flex-1 flex-col">

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


          <div className="shrink-0 select-none p-3 pt-0">

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
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
        style={!isDrawer ? { width, contain: "layout style" } : undefined}
        className={cn(
          !isDrawer && "shrink-0",
          isDrawer && "absolute left-0 top-0 h-full w-62",
          "h-full",
          "isolate z-0 flex flex-col bg-[#1d1c1c] select-none",
          "overflow-hidden",
          "will-change-[width,transform]",
          "transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          isDrawer && (isVisible ? "translate-x-0" : "-translate-x-full"),
          isFullyHidden && "pointer-events-none",
        )}
      >
        <div className="pt-6 pb-6 flex h-full flex-col" style={{ width: isDrawer ? undefined : (collapsed ? SIDEBAR_ASIDE_COLLAPSED_WIDTH : SIDEBAR_ASIDE_OPEN_WIDTH) }}>
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
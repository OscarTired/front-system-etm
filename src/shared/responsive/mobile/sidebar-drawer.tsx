// sidebar-drawer.tsx
"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { cn } from "@/shared/utils/utils"
import { AppSidebar } from "../layout/app-sidebar"

export function SidebarDrawer() {
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Solo pathname: searchParams cambia mucho y re-disparaba close
  // (modo closed + animate) mientras el panel aún se movía → ghost frame.
  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

  useEffect(() => {
    if (mode !== "open") {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () =>
      window.removeEventListener("keydown", handleKeyDown)
  }, [mode, closeDrawer])

  const isVisible = mode === "open"

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "absolute inset-y-0 left-0 z-0 w-62",
        isVisible
          ? "pointer-events-auto"
          : "pointer-events-none",
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="h-full"
      >
        <AppSidebar
          variant="drawer"
          open={isVisible}
        />
      </div>
    </div>
  )
}
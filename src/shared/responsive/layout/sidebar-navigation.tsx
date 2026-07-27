import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { NAVIGATION } from "./navigation"
import { getNavItemMeta } from "./sidebar-nav-item-meta"
import { SidebarItem } from "./sidebar-item"
import { SidebarPresence } from "./sidebar-presence"
import { SidebarSection } from "./sidebar-section"

import { cn } from "@/shared/utils/utils"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import type { ProcessCounts } from "./hooks/use-sidebar-counts"

type SidebarNavigationProps = {
  collapsed?: boolean
  isDrawer?: boolean
  projectsCount: number
  activeTasksCount: number
  processCounts: ProcessCounts
  presenceCollapsed: boolean
  presenceRef?: (node: HTMLDivElement | null) => void
  prefetchOnHover?: (href: string) => void
}

export function SidebarNavigation({
  collapsed,
  isDrawer = false,
  projectsCount,
  activeTasksCount,
  processCounts,
  presenceCollapsed,
  presenceRef,
  prefetchOnHover,
}: SidebarNavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { has } = usePermissions()
  const currentRole = useAuthStore(state => state.user?.role?.code)

  const [isMounting, setIsMounting] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounting(false), 700)
    return () => clearTimeout(timer)
  }, [])

  let globalItemIndex = 0

  return (
    <VerticalScroll
      containerClassName="min-h-0 flex-1 w-full"
      className={cn(
        "overflow-x-hidden scrollbar-gutter-stable w-full",
        isDrawer ? "px-2 py-4" : "px-3 py-3",
      )}
      arrowAlign="center"
      arrowClassName="bg-[#18181b]/5 backdrop-blur-md"
    >
      {!isDrawer && (
        <div
          className={cn(
            collapsed ? "mb-3 flex justify-end" : "mb-3",
            isMounting && "animate-gemini-in opacity-0"
          )}
          style={isMounting ? { animationDelay: "100ms" } : undefined}
        >
          <NotificationBell collapsed={collapsed} />
        </div>
      )}

      {/* Sección Equipo integrada con SidebarSection */}
      <div
        className={cn(
          "w-full",
          isMounting && "animate-gemini-in opacity-0"
        )}
        style={
          isMounting
            ? { animationDelay: "120ms" }
            : undefined
        }
      >
        <SidebarSection
          title="Equipo"
          collapsed={collapsed}
          isDrawer={isDrawer}
        >
          <SidebarPresence
            collapsed={presenceCollapsed}
            presenceRef={presenceRef}
          />
        </SidebarSection>
      </div>
        
      {NAVIGATION.map((section) => {
        const items = section.items.filter(
          item =>
            (!("permission" in item) || has(item.permission)) &&
            (!("roles" in item) ||
              (currentRole != null && (item.roles as readonly string[]).includes(currentRole))),
        )

        if (items.length === 0) {
          return null
        }

        return (
          <SidebarSection
            key={section.title}
            title={section.title}
            collapsed={collapsed}
            isDrawer={isDrawer}
          >
            {items.map(item => {
              const currentIndex = globalItemIndex++
              const { isActive, count } = getNavItemMeta({
                item,
                pathname,
                searchParams,
                projectsCount,
                activeTasksCount,
                processCounts,
              })

              const hasQuery = item.href.includes("?")

              return (
                <div
                  key={item.href}
                  className={cn(
                    "w-full",
                    isMounting && "animate-gemini-in opacity-0"
                  )}
                  style={
                    isMounting
                      ? { animationDelay: `${150 + currentIndex * 35}ms` }
                      : undefined
                  }
                >
                  <SidebarItem
                    collapsed={collapsed}
                    isDrawer={isDrawer}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isActive}
                    count={count}
                    onMouseEnter={
                      hasQuery
                        ? () => prefetchOnHover?.(item.href)
                        : undefined
                    }
                    onTouchStart={
                      hasQuery
                        ? () => prefetchOnHover?.(item.href)
                        : undefined
                    }
                  />
                </div>
              )
            })}
          </SidebarSection>
        )
      })}
    </VerticalScroll>
  )
}
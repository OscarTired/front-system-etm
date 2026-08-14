"use client"

import { Menu, Search, X } from "lucide-react"
import { useState } from "react"

import { useAuthStore } from "@/features/auth/store/auth-store"
import { ProfileDialog } from "@/features/profile"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { MessageBell } from "@/features/comments/components/message-bell"
import { SidebarPresence } from "../../responsive/layout/sidebar/sidebar-presence"
import { usePageTitleStore } from "@/shared/responsive/navigation/page-title-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { usePageSearchStore } from "@/shared/ui/entity-toolbar/page-search-store"
import { TOP_BAR_HEIGHT_PX } from "@/shared/responsive/layout/chrome-constants"

export function TopBar() {
  const toggleDrawer = useMobileNavStore(s => s.toggleDrawer)
  const title = usePageTitleStore(s => s.title)

  const searchEnabled = usePageSearchStore(s => s.enabled)
  const searchOpen = usePageSearchStore(s => s.open)
  const searchValue = usePageSearchStore(s => s.value)
  const searchPlaceholder = usePageSearchStore(s => s.placeholder)
  const setSearchOpen = usePageSearchStore(s => s.setOpen)
  const setSearchQuery = usePageSearchStore(s => s.setQuery)
  const closeSearch = usePageSearchStore(s => s.closeAndClear)

  const user = useAuthStore(s => s.user)
  const [profileOpen, setProfileOpen] = useState(false)

  const avatar = (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-foreground/10 text-xs font-semibold text-muted-foreground">
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : (
        user?.name?.[0]?.toUpperCase() ?? "?"
      )}
    </div>
  )

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20 flex h-14 shrink-0 items-center gap-1.5 px-2.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-16 backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 40%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-16 bg-background/65"
          style={{
            maskImage: "linear-gradient(to bottom, black 30%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent)",
          }}
        />

        <button
          type="button"
          onClick={toggleDrawer}
          aria-label="Abrir navegación"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chrome text-muted-foreground shadow-lg shadow-black/30 backdrop-blur-xl transition hover:bg-chrome active:bg-popover"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <div className="min-w-0 flex-1">
          <div
            title={title}
            className="inline-flex max-w-full items-center rounded-full bg-chrome px-2.5 py-1.5 shadow-lg shadow-black/30 backdrop-blur-xl"
          >
            <span className="truncate text-sm font-semibold text-foreground">
              {title}
            </span>
          </div>
        </div>

        {searchEnabled && (
          <button
            type="button"
            aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar"}
            aria-expanded={searchOpen}
            onClick={() => {
              if (searchOpen) closeSearch()
              else setSearchOpen(true)
            }}
            className={
              searchOpen
                ? "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/20 text-foreground shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-foreground/15 active:bg-foreground/20"
                : "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-foreground/15 active:bg-foreground/20"
            }
          >
            {searchOpen ? (
              <X size={16} strokeWidth={2} />
            ) : (
              <Search size={16} strokeWidth={2} />
            )}
          </button>
        )}

        <SidebarPresence variant="topbar" />
        <MessageBell variant="topbar" />
        <NotificationBell variant="topbar" />

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Perfil"
          disabled={!user}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-foreground/15 active:bg-foreground/20 disabled:opacity-50"
        >
          <div className="relative size-7 shrink-0">
            {user ? (
              avatar
            ) : (
              <div className="size-7 animate-pulse rounded-full bg-foreground/5" />
            )}
          </div>
        </button>
      </header>

      {searchEnabled && searchOpen && (
        <div
          className="absolute inset-x-0 z-20 px-3 pt-1"
          style={{ top: TOP_BAR_HEIGHT_PX }}
        >
          {/* h-10 fijo: con o sin texto la altura no cambia.
              mb-2 = mismo aire que empty state (mt-2) hacia los rows. */}
          <div className="mb-2 flex h-10 items-center gap-2 rounded-xl bg-foreground/5 px-3">
            <Search
              size={15}
              strokeWidth={2.2}
              className="shrink-0 text-muted-foreground"
            />
            <input
              autoFocus
              value={searchValue}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm leading-none text-foreground outline-none placeholder:text-muted-foreground/80"
            />
            <button
              type="button"
              aria-label="Limpiar"
              disabled={!searchValue}
              onClick={() => setSearchQuery("")}
              className={
                searchValue
                  ? "flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                  : "pointer-events-none flex size-7 shrink-0 items-center justify-center rounded-lg opacity-0"
              }
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

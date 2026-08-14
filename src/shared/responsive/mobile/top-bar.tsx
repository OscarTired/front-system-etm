"use client"

import { Menu } from "lucide-react"
import { useState } from "react"

import { useAuthStore } from "@/features/auth/store/auth-store"
import { ProfileDialog } from "@/features/profile"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { MessageBell } from "@/features/comments/components/message-bell"
import { SidebarPresence } from "../../responsive/layout/sidebar/sidebar-presence"
import { ThemeToggle } from "@/shared/theme"
import { usePageTitleStore } from "@/shared/responsive/navigation/page-title-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"

export function TopBar() {
  const toggleDrawer = useMobileNavStore(s => s.toggleDrawer)
  const title = usePageTitleStore(s => s.title)

  const user = useAuthStore(s => s.user)

  const [profileOpen, setProfileOpen] = useState(false)

  const avatar = (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-foreground/5 text-xs font-semibold text-foreground">
      {user?.avatarUrl ? (
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
        {/* Blur progresivo — mismo criterio que BottomNavigation:
            el efecto arranca en 0% abajo de esta zona y llega a
            100% recién cerca del borde superior de la pantalla, en
            vez de una caja plana aplicada de golpe. */}
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
{/* Botón de menú */}
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label="Abrir navegación"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chrome text-muted-foreground shadow-lg shadow-black/30 backdrop-blur-xl transition hover:bg-chrome active:bg-popover"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        {/* Título */}
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

        {/* Presencia en línea con contador explícito */}
        <SidebarPresence variant="topbar" />

        <ThemeToggle
          variant="icon"
          className="size-10 rounded-full bg-chrome shadow-lg shadow-black/30 backdrop-blur-xl hover:bg-chrome active:bg-popover"
        />

        {/* Notificaciones con contador explícito */}
        <MessageBell variant="topbar" />
        <NotificationBell variant="topbar" />

        {/* Botón de perfil */}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Perfil"
          disabled={!user}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-chrome shadow-lg shadow-black/30 backdrop-blur-xl transition hover:bg-chrome active:bg-popover disabled:opacity-50"
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

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
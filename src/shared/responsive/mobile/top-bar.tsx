"use client"

import { Menu } from "lucide-react"
import { useState } from "react"

import { useAuthStore } from "@/features/auth/store/auth-store"
import { ProfileDialog } from "@/features/profile"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { usePageTitleStore } from "@/shared/responsive/navigation/page-title-store"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"

export function TopBar() {

  const toggleDrawer = useMobileNavStore(s => s.toggleDrawer)
  const title = usePageTitleStore(s => s.title)

  const user = useAuthStore(s => s.user)

  const [profileOpen, setProfileOpen] = useState(false)

  const avatar = (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/3 text-xs font-semibold text-white">
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

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-linear-to-b from-black/60 via-black/30 to-transparent" />

      <header className="absolute inset-x-0 top-0 z-20 flex h-14 shrink-0 items-center gap-2 px-3">

        <button
          type="button"
          onClick={toggleDrawer}
          aria-label="Abrir navegación"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-neutral-300 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15 active:bg-white/20"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <span className="min-w-0 flex-1 truncate text-base font-semibold text-neutral-100">
          {title}
        </span>

        <NotificationBell variant="topbar" />

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Perfil"
          disabled={!user}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15 active:bg-white/20 disabled:opacity-50"
        >
          <div className="relative size-7 shrink-0">
            {user ? (
              avatar
            ) : (
              <div className="size-7 animate-pulse rounded-full bg-white/5" />
            )}
          </div>
        </button>

      </header>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

    </>

  )

}
"use client"

import { useMemo, useState } from "react"
import { Users } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

const MAX_LIST_HEIGHT = 168

type Props = {
  collapsed?: boolean
  presenceRef?: (node: HTMLDivElement | null) => void
}

function UserRow({
  user,
}: {
  user: { id: string; name: string; avatarUrl?: string | null }
}) {
  return (
    <div
      key={user.id}
      className="flex items-center gap-2 rounded-xl bg-white/3 px-2.5 py-2 transition-all duration-200 hover:bg-white/6"
    >
      <div className="relative h-5 w-5 shrink-0">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white/8 text-[10px] font-semibold text-white">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            user.name[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0A0A0A]"
        />
      </div>

      <span className="truncate text-xs font-medium text-neutral-300">
        {user.name}
      </span>
    </div>
  )
}

export function SidebarPresence({
  collapsed = false,
  presenceRef,
}: Props) {
  const [open, setOpen] = useState(false)

  const currentUser = useAuthStore(s => s.user)
  const { users } = useUsersDirectory()

  const onlineUsers = useMemo(
    () =>
      users
        .filter(user => user.online && user.id !== currentUser?.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users, currentUser?.id],
  )

  const hasOnlineUsers = onlineUsers.length > 0

  if (!currentUser) {
    if (collapsed) {
      return (
        <div ref={presenceRef} className="mx-1 my-1 px-0 flex justify-center">
          <div className="h-8 w-8 rounded-md bg-white/5 animate-pulse" />
        </div>
      )
    }

    return (
      <div ref={presenceRef} className="mx-1 my-1 px-3 py-1">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">
            En línea
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 rounded-xl bg-white/3 px-2.5 py-2">
            <div className="h-5 w-5 shrink-0 rounded-full bg-white/5 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasOnlineUsers) {
    return null
  }

  // ==========================================
  // ESTADO COLAPSADO (Idéntico a SidebarItem colapsado)
  // ==========================================
  if (collapsed) {
    return (
      <div ref={presenceRef} className="select-none my-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              title={`${onlineUsers.length} en línea`}
              className={cn(
                "mx-1 flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                open
                  ? "bg-white/6 text-white"
                  : "text-neutral-400 hover:bg-white/4 hover:text-white"
              )}
            >
              <span className="relative flex items-center justify-center">
                <Users size={14} />
                <span className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">
                  {onlineUsers.length > 9 ? "9+" : onlineUsers.length}
                </span>
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent
            data-sidebar-popover
            side="right"
            align="start"
            sideOffset={8}
            className="z-90 w-72 p-0 border-none bg-[#171717] text-white shadow-xl"
          >
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-sm font-semibold text-neutral-200">
                En línea
              </span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/15 px-1.5 text-[11px] font-semibold text-emerald-400">
                {onlineUsers.length}
              </span>
            </div>

            <VerticalScroll
              className="space-y-1 px-2 pb-2"
              style={{ maxHeight: 320 }}
            >
              {onlineUsers.map(user => (
                <UserRow key={user.id} user={user} />
              ))}
            </VerticalScroll>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // ==========================================
  // ESTADO EXPANDIDO (Idéntico a SidebarItem expandido)
  // ==========================================
  return (
    <div ref={presenceRef} className="select-none my-1">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="mb-2 px-3 h-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">
            En línea
          </span>
        </div>

        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "mx-1 flex h-8 min-w-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors w-[calc(100%-8px)]",
              open
                ? "bg-white/6 text-white"
                : "text-neutral-400 hover:bg-white/4 hover:text-white"
            )}
          >
            <span className="relative flex shrink-0 items-center justify-center">
              <Users size={14} />
            </span>

            <span className="min-w-0 flex-1 truncate text-left">
              En línea
            </span>

            <span className="ml-auto flex h-6 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-emerald-400">
              {onlineUsers.length}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          data-sidebar-popover
          side="right"
          align="start"
          sideOffset={8}
          className="z-90 w-72 p-0 border-none bg-[#171717] text-white shadow-xl"
        >
          <div className="flex items-center justify-between px-3.5 py-3">
            <span className="text-sm font-semibold text-neutral-200">
              En línea
            </span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/15 px-1.5 text-[11px] font-semibold text-emerald-400">
              {onlineUsers.length}
            </span>
          </div>

          <VerticalScroll
            className="space-y-1 px-2 pb-2"
            style={{ maxHeight: MAX_LIST_HEIGHT }}
          >
            {onlineUsers.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </VerticalScroll>
        </PopoverContent>
      </Popover>
    </div>
  )
}
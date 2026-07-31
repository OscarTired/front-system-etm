"use client"

import { useMemo, useState, useRef } from "react"
import { Users, Search, ChevronDown } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { formatNotificationDate } from "@/features/notifications/utils/format-notification-date"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
} from "@/components/ui/command"

import { Input } from "@/components/ui/input"

type Props = {
  collapsed?: boolean
  isDrawer?: boolean
  variant?: "sidebar" | "topbar"
  presenceRef?: (node: HTMLDivElement | null) => void
}

// Cuántos se muestran de entrada, antes de tener que tocar
// "Ver todos" — como en cualquier lista de presencia de una red
// social (WhatsApp Web, Discord), no todo el equipo de una.
const DEFAULT_VISIBLE_COUNT = 4

type PresenceUser = {
  id: string
  name: string
  avatarUrl?: string | null
  online: boolean
  lastSeenAt?: string | null
}

function UserRow({
  user,
}: {
  user: PresenceUser
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 min-w-0">
      <div className="relative h-6 w-6 shrink-0">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-[10px] font-medium text-neutral-300 ring-1 ring-white/10">
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
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#171717]",
            user.online ? "bg-emerald-500" : "bg-neutral-600",
          )}
        />
      </div>

      <div className="min-w-0 flex-1">

        <span className="block truncate text-xs font-medium text-neutral-300">
          {user.name}
        </span>

        {/* Mismo criterio de cualquier red social: online no
            necesita explicación (el punto verde ya lo dice), offline
            sí se aclara cuándo fue la última vez — si nunca se
            conectó, no hay nada que mostrar. */}
        {!user.online && user.lastSeenAt && (
          <span className="block truncate text-[10px] text-neutral-500">
            Últ. vez hace {formatNotificationDate(user.lastSeenAt)}
          </span>
        )}

      </div>

    </div>
  )
}

export function SidebarPresence({
  collapsed = false,
  isDrawer = false,
  variant = "sidebar",
  presenceRef,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentUser = useAuthStore(s => s.user)
  const { users } = useUsersDirectory()

  const onlineUsers = useMemo(
    () =>
      users
        .filter(user => user.online && user.id !== currentUser?.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users, currentUser?.id],
  )

  // Disponibles pero desconectados — antes ni se mostraban. Se
  // ordenan por "visto por última vez" más reciente primero (los
  // que probablemente vuelvan pronto quedan arriba de los que
  // capaz ni se acuerdan que existe la app), y los que nunca se
  // conectaron (lastSeenAt null) van al final, por nombre.
  const offlineUsers = useMemo(
    () =>
      users
        .filter(user => !user.online && user.id !== currentUser?.id)
        .sort((a, b) => {

          if (!a.lastSeenAt && !b.lastSeenAt) {
            return a.name.localeCompare(b.name)
          }

          if (!a.lastSeenAt) return 1
          if (!b.lastSeenAt) return -1

          return (
            new Date(b.lastSeenAt).getTime() -
            new Date(a.lastSeenAt).getTime()
          )

        }),
    [users, currentUser?.id],
  )

  // Online siempre arriba — mismo orden que cualquier lista de
  // presencia (WhatsApp, Discord, Slack).
  const allUsers = useMemo(
    () => [...onlineUsers, ...offlineUsers],
    [onlineUsers, offlineUsers],
  )

  const filteredUsers = useMemo(() => {

    const search = query.trim().toLowerCase()

    const base = search
      ? allUsers.filter(user => user.name.toLowerCase().includes(search))
      : allUsers

    // Buscando (o ya expandido a propósito) se ve la lista completa
    // — el límite de 4 es solo para el primer vistazo, sin filtro
    // ni intención explícita de ver a todos.
    if (search || expanded) {
      return base
    }

    return base.slice(0, DEFAULT_VISIBLE_COUNT)

  }, [allUsers, query, expanded])

  const hasMore =
    !query.trim() && !expanded && allUsers.length > DEFAULT_VISIBLE_COUNT

  const isTopbar = variant === "topbar"

  if (!currentUser) {
    if (isTopbar) {
      return <div className="size-10 shrink-0 rounded-full bg-white/10 animate-pulse" />
    }
    if (collapsed) {
      return (
        <div ref={presenceRef} className="mx-1 my-1 px-0 flex justify-center">
          <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        </div>
      )
    }

    return (
      <div ref={presenceRef} className="mx-1 my-1 px-3 py-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
            <div className="h-5 w-5 shrink-0 rounded-full bg-muted animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setExpanded(false)
    }
  }

  return (
    <div ref={presenceRef} className={cn(!isTopbar && "select-none my-1")}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {isTopbar ? (
            <button
              type="button"
              aria-label="Usuarios en línea"
              className={cn(
                "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-neutral-300 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15 active:bg-white/20",
                open && "bg-white/20 text-white",
              )}
            >
              <Users size={17} strokeWidth={2.2} />
              {onlineUsers.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-semibold text-white">
                  {onlineUsers.length > 9 ? "9+" : onlineUsers.length}
                </span>
              )}
            </button>
          ) : isDrawer ? (
            <button
              type="button"
              className={cn(
                "flex h-12 w-full min-w-0 items-center gap-3 rounded-xl px-4 text-base font-medium transition-colors",
                open
                  ? "bg-white/10 text-white"
                  : "text-neutral-300 hover:bg-white/5 hover:text-white active:bg-white/10 active:text-white",
              )}
            >
              <span className="relative flex shrink-0 items-center justify-center">
                <Users size={19} />
              </span>

              <span className="min-w-0 flex-1 truncate text-left">
                Activos
              </span>

              {onlineUsers.length > 0 && (
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    open ? "text-white" : "text-neutral-500",
                  )}
                >
                  {onlineUsers.length}
                </span>
              )}
            </button>
          ) : collapsed ? (
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
                <span className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-semibold text-white">
                  {onlineUsers.length > 9 ? "9+" : onlineUsers.length}
                </span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                "mx-1 flex h-8 min-w-0 items-center rounded-md text-sm font-medium transition-colors w-[calc(100%-8px)] gap-2 px-3",
                open
                  ? "bg-white/6 text-white"
                  : "text-neutral-400 hover:bg-white/4 hover:text-white"
              )}
            >
              <span className="relative flex shrink-0 items-center justify-center">
                <Users size={14} />
              </span>

              <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                Activos
              </span>

              <span className="ml-auto flex h-5 min-w-5 px-1 items-center justify-center rounded-md bg-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                {onlineUsers.length}
              </span>
            </button>
          )}
        </PopoverTrigger>

        <PopoverContent
          data-sidebar-popover
          side={isTopbar ? "bottom" : "right"}
          align={isTopbar ? "end" : "start"}
          sideOffset={8}
          floatingClassName="w-72"
          className="z-50 w-full min-w-90 p-2 shadow-xl rounded-xl overflow-hidden bg-[#171717] text-white border-none"
        >
          <Command className="bg-transparent" shouldFilter={false}>
            <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">
              <Search
                size={14}
                className="text-neutral-500 shrink-0"
              />
              <Input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar miembro..."
                className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
              />
            </div>

            <CommandList className={cn(
              "select-none overflow-y-auto",
              expanded || query.trim() ? "max-h-64" : "",
            )}>
              <CommandEmpty>
                {allUsers.length === 0 ? "Sin miembros" : "Sin resultados"}
              </CommandEmpty>

              <CommandGroup>
                {filteredUsers.map(user => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => {}}
                    className="p-0 rounded-lg cursor-pointer bg-transparent aria-selected:bg-transparent aria-selected:text-accent-foreground"
                  >
                    <div className="w-full">
                      <UserRow user={user} />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {hasMore && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Ver todos
                  <span className="text-neutral-600">
                    ({allUsers.length})
                  </span>
                  <ChevronDown size={13} />
                </button>
              )}

            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
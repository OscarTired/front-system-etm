"use client"

import { useMemo, useState, useRef } from "react"
import { Users, Search, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { formatNotificationDate } from "@/features/notifications/utils/format-notification-date"
import { SidebarRow, sidebarRowClassName } from "./sidebar-row"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Dialog, DialogContent } from "@/components/ui/dialog"

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
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 w-full min-w-0 bg-transparent">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
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

        {/* Nombre del usuario alineado a la izquierda */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-neutral-300">
            {user.name}
          </span>
        </div>
      </div>

      {/* Estado (Activo o última vez) movido por completo hacia el lado derecho */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {user.online ? (
          <span className="text-[10px] text-neutral-500 font-mono">Activo</span>
        ) : user.lastSeenAt ? (
          <span className="text-[10px] text-neutral-500 truncate max-w-27.5">
            Hace {formatNotificationDate(user.lastSeenAt)}
          </span>
        ) : null}
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

  const allUsers = useMemo(
    () => [...onlineUsers, ...offlineUsers],
    [onlineUsers, offlineUsers],
  )

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase()

    const base = search
      ? allUsers.filter(user => user.name.toLowerCase().includes(search))
      : allUsers

    if (search || expanded) {
      return base
    }

    return base.slice(0, DEFAULT_VISIBLE_COUNT)
  }, [allUsers, query, expanded])

  const showToggle = !query.trim() && allUsers.length > DEFAULT_VISIBLE_COUNT

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
      setTimeout(() => {
        setQuery("")
        setExpanded(false)
      }, 200)
    }
  }

  const renderTriggerContent = () => {
    if (isTopbar) {
      return (
        <button
          type="button"
          aria-label="Usuarios en línea"
          onClick={() => handleOpenChange(!open)}
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-neutral-300 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15 active:bg-white/20",
            open && "bg-white/20 text-white",
          )}
        >
          <Users size={17} strokeWidth={2.2} />
          {onlineUsers.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">
              {onlineUsers.length > 9 ? "9+" : onlineUsers.length}
            </span>
          )}
        </button>
      )
    }

    if (isDrawer) {
      return (
        <button
          type="button"
          className={cn(
            open
              ? "bg-white/15 text-white"
              : "text-neutral-300 hover:bg-white/5 hover:text-white active:bg-white/10 active:text-white",
          )}
        >
          <SidebarRow
            icon={Users}
            label="Activos"
            active={open}
            count={onlineUsers.length > 0 ? onlineUsers.length : undefined}
            isDrawer
          />
        </button>
      )
    }

    if (collapsed) {
      return (
        <button
          type="button"
          title={`${onlineUsers.length} en línea`}
          className={cn(
            sidebarRowClassName({ collapsed: true, active: open }),
            "size-8 mx-auto"
          )}
        >
          <SidebarRow
            icon={Users}
            label="Activos"
            collapsed
            active={open}
            count={onlineUsers.length >= 0 ? (onlineUsers.length > 9 ? "9+" : String(onlineUsers.length)) : undefined}
            collapsedBadgeColor="bg-emerald-500/20 text-emerald-400"
            size="sm"
          />
        </button>
      )
    }

    return (
      <button
        type="button"
        className={cn(sidebarRowClassName({ active: open }), "w-[calc(100%-8px)]")}
      >
        <SidebarRow
          icon={Users}
          label="Activos"
          active={open}
          count={String(onlineUsers.length)}
          badgeColor="bg-emerald-500/20 text-emerald-400"
          size="sm"
        />
      </button>
    )
  }

  const panelBody = (
    <Command className="bg-transparent flex flex-col h-full" shouldFilter={false}>
      <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2 bg-[#171717] shrink-0">
        <Search size={14} className="text-neutral-500 shrink-0" />
        <Input
          ref={inputRef}
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar miembro..."
          className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
        />
      </div>

      <CommandList className={cn(
        "select-none overflow-y-auto transition-all duration-200 ease-in-out flex-1",
        !isTopbar && (expanded || query.trim() ? "max-h-96" : "max-h-60"),
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
              /* Evitamos que el CommandItem muestre estados de hover/focus residuales al contraer */
              className="p-0 rounded-lg bg-transparent hover:bg-transparent focus:bg-transparent aria-selected:bg-transparent aria-selected:text-white pointer-events-none data-[selected=true]:bg-transparent"
            >
              <div className="w-full pointer-events-auto">
                <UserRow user={user} />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {showToggle && (
        <div className="pt-2 mt-1 shrink-0">
          {!expanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur()
                setExpanded(true)
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-neutral-400 bg-transparent"
            >
              Ver todos
              <span className="text-neutral-600">
                ({allUsers.length})
              </span>
              <ChevronDown size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur()
                setExpanded(false)
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-white bg-white/5"
            >
              Mostrar menos
              <ChevronUp size={13} />
            </button>
          )}
        </div>
      )}
    </Command>
  )

  return (
    <div ref={presenceRef} className={cn(!isTopbar && "select-none my-1")}>
      {isTopbar ? (
        <>
          {renderTriggerContent()}

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
              size="large"
              className="flex flex-col overflow-hidden rounded-2xl bg-[#171717] p-2 text-white shadow-2xl"
            >
              {panelBody}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{renderTriggerContent()}</PopoverTrigger>

          <PopoverContent
            data-sidebar-popover
            side="right"
            align="start"
            sideOffset={8}
            floatingClassName="w-72"
            className="z-40 w-full min-w-90 max-w-lg p-2 shadow-xl rounded-xl overflow-hidden bg-[#171717] text-white border-none select-none flex flex-col"
          >
            {panelBody}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
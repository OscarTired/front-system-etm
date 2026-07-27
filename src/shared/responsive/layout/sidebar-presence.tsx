"use client"

import { useMemo, useState, useRef } from "react"
import { Users, Search } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"

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
  presenceRef?: (node: HTMLDivElement | null) => void
}

function UserRow({
  user,
}: {
  user: { id: string; name: string; avatarUrl?: string | null }
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-all duration-150">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative h-5 w-5 shrink-0">
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
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-neutral-900"
          />
        </div>

        <span className="truncate text-xs font-medium text-neutral-300 transition-colors">
          {user.name}
        </span>
      </div>

      <div className="flex items-center gap-1.5 opacity-0 transition-opacity">
        <span className="text-[10px] text-neutral-500 font-mono">Activo</span>
      </div>
    </div>
  )
}

export function SidebarPresence({
  collapsed = false,
  presenceRef,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
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

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return onlineUsers
    return onlineUsers.filter(user => user.name.toLowerCase().includes(search))
  }, [onlineUsers, query])

  if (!currentUser) {
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
    }
  }

  // ==========================================
  // ESTADO COLAPSADO
  // ==========================================
  if (collapsed) {
    return (
      <div ref={presenceRef} className="select-none my-1">
        <Popover open={open} onOpenChange={handleOpenChange}>
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
                <span className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-semibold text-white">
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
            className="z-50 w-72 p-2 shadow-xl rounded-xl overflow-hidden"
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

              <CommandList className="max-h-64 overflow-y-auto">
                <CommandEmpty>
                  {onlineUsers.length === 0 ? "Sin conectados" : "Sin resultados"}
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
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // ==========================================
  // ESTADO EXPANDIDO
  // ==========================================
  return (
    <div ref={presenceRef} className="select-none my-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
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

            {onlineUsers.length > 0 && (
              <div className="flex items-center -space-x-1.5 shrink-0 py-0.5">
                {onlineUsers.slice(0, 3).map((user, index) => (
                  <div
                    key={user.id}
                    className="relative h-4 w-4 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-neutral-900"
                    style={{ zIndex: 3 - index }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-neutral-300">
                        {user.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {onlineUsers.length > 3 && (
                  <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-[8px] font-mono text-neutral-400 ring-1 ring-neutral-900" style={{ zIndex: 0 }}>
                    +{onlineUsers.length - 3}
                  </div>
                )}
              </div>
            )}

            <span className="ml-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-md bg-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              {onlineUsers.length}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          data-sidebar-popover
          side="right"
          align="start"
          sideOffset={8}
          className="z-50 w-72 p-2 shadow-xl rounded-xl overflow-hidden"
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

            <CommandList className="max-h-64 overflow-y-auto">
              <CommandEmpty>
                {onlineUsers.length === 0 ? "Sin conectados" : "Sin resultados"}
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
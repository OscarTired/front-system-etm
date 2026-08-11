"use client"

import {
  PopoverContent,
} from "@/components/ui/popover"

import {
  Command,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"

interface MentionableUser {
  id: string
  username: string | null
  name: string
  avatarUrl: string | null
  color: string
}

type Props = {
  users: MentionableUser[]
  onSelect: (username: string) => void
}

export function MentionSuggestions({ users, onSelect }: Props) {

  return (

    <PopoverContent
      align="start"
      side="top"
      sideOffset={8}
      onOpenAutoFocus={(e) => e.preventDefault()}
      className="w-64 p-2"
    >

      <Command className="bg-transparent">

        <CommandList className="max-h-64 min-w-0 w-full">

          <CommandGroup>

            {users.slice(0, 6).map(user => (

              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(user.username ?? user.name)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
              >

                <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/5 ring-1 ring-white/8 text-[10px] font-semibold text-white shadow-inner">

                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}

                </div>

                <span className="truncate text-sm text-neutral-200">{user.name}</span>

                {user.username && (
                  <span className="ml-auto shrink-0 text-xs text-neutral-500">@{user.username}</span>
                )}

              </button>

            ))}

          </CommandGroup>

        </CommandList>

      </Command>

    </PopoverContent>

  )

}
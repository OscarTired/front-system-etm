"use client"

import { cn } from "@/shared/utils/utils"

import type { User } from "@/features/users/types/user.types"

type Props = {
  user: User
  selected: boolean
  onSelect: () => void
}

// Calco de RoleDesktopRow, pero para usuarios -- mismo selector
// maestro-detalle, solo que la lista de la izquierda son personas
// en vez de roles.
export function UserDesktopRow({ user, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected
          ? "bg-white/10 text-white"
          : "hover:bg-white/4 text-neutral-300"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: user.color || "#71717a" }}
        />
        <span className="truncate text-sm font-medium">
          {user.name}
        </span>
      </div>

      {!user.active && (
        <span className="shrink-0 text-xs text-neutral-500">Inactivo</span>
      )}
    </button>
  )
}
"use client"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import type { User } from "@/features/users/types/user.types"

type Props = {
  user: User
  index: number
  onSelect: () => void
}

// Calco de RoleMobileCard, pero para usuarios.
export function UserMobileCard({ user, index, onSelect }: Props) {
  return (
    <article className="overflow-hidden rounded-xl bg-white/2">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
      >
        <header className="flex items-center justify-between gap-2.5 px-3 py-3">
          <span className="text-xs font-semibold tracking-[0.12em] text-neutral-500">
            USUARIO {String(index + 1).padStart(3, "0")}
          </span>

          {!user.active && (
            <span className="text-xs font-medium text-neutral-500">
              Inactivo
            </span>
          )}
        </header>

        <div className="flex items-center gap-2.5 px-3 pb-3">
          <div className="min-w-0 flex-1">
            <DynamicBadge
              label={user.name}
              icon={user.icon}
              color={user.color}
              width="field"
            />
          </div>
        </div>
      </button>
    </article>
  )
}
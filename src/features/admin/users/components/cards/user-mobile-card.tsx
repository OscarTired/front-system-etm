"use client"

import {
  ChevronDown,
} from "lucide-react"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  cn,
} from "@/shared/utils/utils"

import type {
  User,
} from "@/features/users/types/user.types"

import {
  UserRowActions,
} from "../actions/user-row-actions"

type Props = {
  user: User
  index: number
  expanded: boolean
  onToggle: () => void
}

export function UserMobileCard({
  user,
  index,
  expanded,
  onToggle,
}: Props) {

  return (

    <article className="overflow-hidden rounded-xl bg-foreground/5">

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >

        <header className="flex items-center justify-between gap-2.5 px-3 py-3">

          <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground">
            USUARIO {String(index + 1).padStart(3, "0")}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">

            <span
              aria-hidden
              className={
                user.online
                  ? "h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]"
                  : "h-1.5 w-1.5 rounded-full bg-muted-foreground"
              }
            />

            {user.online
              ? "En línea"
              : "Desconectado"}

          </span>

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

          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />

        </div>

      </button>

      {expanded && (

        <div className="space-y-3 px-3 pb-3 pt-3">

          <dl className="space-y-3 text-sm">

            <div className="min-w-0">

              <dt className="mb-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">
                USERNAME
              </dt>

              <dd className="truncate text-foreground">
                {user.username ?? "Sin username"}
              </dd>

            </div>

            <div className="min-w-0">

              <dt className="mb-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">
                EMAIL
              </dt>

              <dd className="truncate text-muted-foreground">
                {user.email}
              </dd>

            </div>

          </dl>

          <div className="flex flex-wrap gap-1.5">
            {user.roles.map(role => (
              <DynamicBadge
                key={role.id}
                label={role.name}
                icon={role.icon}
                color={role.color}
              />
            ))}
          </div>

          <div className="flex justify-start">

            <UserRowActions
              userId={user.id}
            />

          </div>

        </div>

      )}

    </article>

  )

}
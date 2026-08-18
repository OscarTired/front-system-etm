"use client"

import { useState } from "react"
import { Users } from "lucide-react"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"
import { SelectOption } from "@/shared/ui/select-option/select-option"
import { cn } from "@/shared/utils/utils"
import type { User } from "@/features/users/types/user.types"
import { withSelectedFirst } from "@/shared/utils/with-selected-first"

export type ConvocarOption = {
  user: User
  description?: string
  descriptionColor?: string
}

type Props = {
  options: ConvocarOption[]
  selectedUserId?: string
  onSelect: (user: User | undefined) => void
  active?: boolean
  emptyLabel?: string
  variant?: "compact" | "field"
  className?: string
  disabled?: boolean
}

/**
 * Menú Convocar compartido (planta + ingeniería).
 * Popover + Command + SelectOption.
 */
export function ConvocarMenu({
  options,
  selectedUserId,
  onSelect,
  active = false,
  emptyLabel = "No hay personas disponibles.",
  variant = "compact",
  className,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.user.id === selectedUserId)?.user

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 font-medium transition-colors disabled:opacity-50",
            variant === "compact" &&
              "min-w-30 justify-center rounded-lg px-2.5 py-1 text-xs",
            variant === "field" &&
              "w-full min-w-0 justify-between rounded-xl px-3 py-2.5 text-sm",
            active
              ? "bg-foreground/20 text-foreground shadow-sm"
              : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10",
            variant === "field" && selected && "text-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Users size={variant === "field" ? 15 : 13} className="shrink-0" />
            <span className="truncate">
              {variant === "field"
                ? selected
                  ? selected.name
                  : "Convocar…"
                : active
                  ? "Seleccionando…"
                  : "Convocar"}
            </span>
          </span>
          {variant === "field" && selected && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              Cambiar
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align={variant === "field" ? "start" : "end"}
        floatingClassName={
          variant === "field"
            ? "w-[var(--radix-popover-trigger-width)] min-w-64"
            : "w-72"
        }
        className="p-2"
      >
        <Command>
          <CommandList
            className={cn(
              "min-w-0 w-full",
              variant === "field"
                ? "max-h-64 overflow-y-auto"
                : "max-h-none overflow-visible tablet:max-h-64 tablet:overflow-y-auto",
            )}
          >
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {withSelectedFirst(
              options.map(o => ({ ...o, id: o.user.id })),
              selectedUserId,
            ).map(({ user, description, descriptionColor }) => (
                <SelectOption
                  key={user.id}
                  label={user.name}
                  icon={user.icon}
                  color={user.color ?? "#64748B"}
                  selected={selectedUserId === user.id}
                  description={description}
                  descriptionColor={descriptionColor}
                  onSelect={() => {
                    const deselect = selectedUserId === user.id
                    onSelect(deselect ? undefined : user)
                    setOpen(false)
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

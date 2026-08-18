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

type Props = {
  users: User[]
  value?: User
  onChange: (user: User | undefined) => void
  disabled?: boolean
  emptyHint?: string
}

/**
 * Menú Convocar en el dialog de ingeniería.
 * Mismo contrato que SummonOperatorButton (Popover + Command + SelectOption).
 */
export function EngineeringConvocarSelect({
  users,
  value,
  onChange,
  disabled,
  emptyHint = "No hay usuarios con rol Ingeniería.",
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-foreground/5 px-3 py-2.5 text-left text-sm transition",
            "hover:bg-foreground/10 disabled:opacity-50",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Users size={15} className="shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">
              {value ? value.name : "Convocar…"}
            </span>
          </span>
          {value && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              Cambiar
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        floatingClassName="w-[var(--radix-popover-trigger-width)] min-w-64"
        className="p-2"
      >
        <Command>
          <CommandList className="max-h-64 min-w-0 w-full overflow-y-auto">
            <CommandEmpty>{emptyHint}</CommandEmpty>
            <CommandGroup>
              {users.map(user => (
                <SelectOption
                  key={user.id}
                  label={user.name}
                  icon={user.icon}
                  color={user.color ?? "#64748B"}
                  selected={value?.id === user.id}
                  onSelect={() => {
                    const deselect = value?.id === user.id
                    onChange(deselect ? undefined : user)
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

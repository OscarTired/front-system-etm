"use client"

import {
  useMemo,
  useRef,
  useState,
} from "react"

import {
  Search,
} from "lucide-react"

import {
  Input,
} from "@/components/ui/input"

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
} from "@/components/ui/command"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  SelectOption,
} from "@/shared/ui/select-option/select-option"

import type {
  Role,
} from "../types/role.types"

type Props = {
  value: Role[]
  items: Role[]
  placeholder: string
  onChange: (roles: Role[]) => void
}

// Un usuario ahora puede tener varios roles a la vez (ej.
// Ingeniería + Proyectos), sumando los permisos de todos — mismo
// patrón que AreaMultiSelect: el popover NO se cierra al elegir una
// opción, así se pueden marcar varias seguidas.
export function RoleMultiSelect({
  value,
  items,
  placeholder,
  onChange,
}: Props) {

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)

  const filteredItems = useMemo(() => {

    const search = query.trim().toLowerCase()

    if (!search) {
      return items
    }

    return items.filter(
      role => role.name.toLowerCase().includes(search),
    )

  }, [items, query])

  const triggerLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0].name
        : value.map(role => role.name).join(", ")

  const triggerVisuals =
    value.length === 1
      ? value[0]
      : null

  function toggleRole(role: Role) {

    const isSelected = value.some(v => v.id === role.id)

    onChange(
      isSelected
        ? value.filter(v => v.id !== role.id)
        : [...value, role],
    )

  }

  return (

    <Popover
      open={open}
      onOpenChange={nextOpen => {

        setOpen(nextOpen)

        if (!nextOpen) {
          setQuery("")
          return
        }

        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })

      }}
    >

      <PopoverTrigger className="flex w-full min-w-0 items-center">

        <DynamicBadge
          label={triggerLabel}
          icon={triggerVisuals?.icon}
          color={triggerVisuals?.color ?? "#64748B"}
          placeholder={value.length === 0}
          width="field"
          showChevron
          chevronOpen={open}
        />

      </PopoverTrigger>

      <PopoverContent sideOffset={8} className="w-72 p-2">

        <Command className="bg-transparent">

          <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">

            <Search size={14} className="text-white/35" />

            <Input
              ref={inputRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Buscar rol..."
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />

          </div>

          <CommandList className="max-h-64 overflow-y-auto">

            <CommandEmpty>
              Sin resultados
            </CommandEmpty>

            <CommandGroup>

              {filteredItems.map(role => (

                <SelectOption
                  key={role.id}
                  label={role.name}
                  icon={role.icon}
                  color={role.color}
                  selected={value.some(v => v.id === role.id)}
                  onSelect={() => toggleRole(role)}
                />

              ))}

            </CommandGroup>

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>

  )

}
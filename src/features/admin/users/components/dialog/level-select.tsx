"use client"

import { useState } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
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
  EntityIcon,
} from "@/shared/constants/entity-icons"

export type Level = "OPERARIO" | "SUPERVISOR"

// Mismo criterio que roles-select.tsx: acá también son solo 2
// opciones hoy, pero si mañana se agrega un tercer sub-nivel en
// Producción, esta lista es el único lugar a tocar — el selector
// ya escala solo.
const LEVEL_OPTIONS: {
  value: Level
  label: string
  color: string
  icon: EntityIcon
}[] = [
  {
    value: "OPERARIO",
    label: "Operario",
    color: "#7C3AED",
    icon: "operator",
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    color: "#0284C7",
    icon: "shield",
  },
]

type Props = {
  value: Level | null
  placeholder?: string
  // Subconjunto de niveles a ofrecer. Por defecto los 2 (Producción,
  // que tiene Operario y Supervisor). Departamentos que solo usan
  // Supervisor (Ingeniería, Proyectos) pasan ["SUPERVISOR"] acá en
  // vez de esconder manualmente la opción Operario en cada caller.
  levels?: Level[]
  onChange: (level: Level | null) => void
}

export function LevelSelect({
  value,
  placeholder = "Seleccionar sub-nivel",
  levels,
  onChange,
}: Props) {

  const [open, setOpen] = useState(false)

  const options =
    levels
      ? LEVEL_OPTIONS.filter(
          option => levels.includes(option.value),
        )
      : LEVEL_OPTIONS

  const selected =
    options.find(
      option => option.value === value,
    )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >

      <PopoverTrigger className="flex w-full min-w-0 items-center">

        <DynamicBadge
          label={selected?.label ?? placeholder}
          color={selected?.color ?? "#64748B"}
          icon={selected?.icon}
          placeholder={!selected}
          width="field"
          showChevron
          chevronOpen={open}
        />

      </PopoverTrigger>

      <PopoverContent
        sideOffset={8}
        floatingClassName="w-64"
        className="p-2"
      >

        <Command className="bg-transparent">

          <CommandList className="max-h-none overflow-visible tablet:max-h-64 tablet:overflow-y-auto">

            <CommandGroup>

              {([...options].sort((a, b) => {
                if (a.value === value) return -1
                if (b.value === value) return 1
                return 0
              })).map(option => (

                <SelectOption
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  color={option.color}
                  selected={value === option.value}
                  onSelect={() => {

                    onChange(
                      value === option.value
                        ? null
                        : option.value,
                    )

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
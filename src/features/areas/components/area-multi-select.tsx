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

import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import type { ProcessCode } from "@/features/tasks/types/task.types"

import { useAreas } from "../hooks/use-areas"
import type { Area } from "../types/area.types"

function isProcessCode(value: string | null): value is ProcessCode {
  return !!value && value in PROCESS_DEFINITIONS
}

// Mismo criterio que AreaSelect: íconos/colores del área se toman
// de PROCESS_DEFINITIONS cuando el área tiene processCode.
function getAreaVisuals(area: Area) {

  if (isProcessCode(area.processCode)) {

    const definition = PROCESS_DEFINITIONS[area.processCode]

    return {
      icon: definition.icon,
      color: definition.color,
    }

  }

  return {
    icon: "shield" as const,
    color: "#64748B",
  }

}

type Props = {
  value: Area[]
  placeholder?: string
  onChange: (areas: Area[]) => void
}

// Un operario ahora puede pertenecer a varias áreas a la vez (antes
// era 1 a 1, ver AreaSelect) — a propósito el popover NO se cierra
// al elegir una opción, así se pueden marcar varias seguidas sin
// tener que reabrirlo cada vez. Se cierra solo con click afuera o
// Escape (comportamiento normal del Popover).
export function AreaMultiSelect({
  value,
  placeholder = "Seleccionar áreas",
  onChange,
}: Props) {

  const [open, setOpen] = useState(false)

  const { areas } = useAreas()

  const triggerLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0].label
        : value.map(area => area.label).join(", ")

  const triggerVisuals =
    value.length === 1
      ? getAreaVisuals(value[0])
      : null

  function toggleArea(area: Area) {

    const isSelected = value.some(v => v.id === area.id)

    onChange(
      isSelected
        ? value.filter(v => v.id !== area.id)
        : [...value, area],
    )

  }

  return (

    <Popover open={open} onOpenChange={setOpen}>

      <PopoverTrigger className="flex w-full min-w-0 items-center">

        <DynamicBadge
          label={triggerLabel}
          color={triggerVisuals?.color ?? "#64748B"}
          icon={triggerVisuals?.icon}
          placeholder={value.length === 0}
          width="field"
          showChevron
          chevronOpen={open}
        />

      </PopoverTrigger>

      <PopoverContent sideOffset={8} floatingClassName="w-64" className="p-2">

        <Command className="bg-transparent">

          <CommandList className="max-h-none overflow-visible tablet:max-h-64 tablet:overflow-y-auto">

            <CommandGroup>

              {areas.map(area => {

                const optionVisuals = getAreaVisuals(area)
                const selected = value.some(v => v.id === area.id)

                return (

                  <SelectOption
                    key={area.id}
                    label={area.label}
                    icon={optionVisuals.icon}
                    color={optionVisuals.color}
                    selected={selected}
                    onSelect={() => toggleArea(area)}
                  />

                )

              })}

            </CommandGroup>

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>

  )

}
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

// Íconos/colores del área se toman de PROCESS_DEFINITIONS (mismo
// origen que ya usa el Kanban/panel lateral) cuando el área tiene
// processCode — así no hay que duplicar esa paleta en el modelo
// Area del backend, que a propósito no tiene icon/color propios.
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
  value: Area | null | undefined
  placeholder?: string
  onChange: (area: Area | null) => void
}

export function AreaSelect({
  value,
  placeholder = "Seleccionar área",
  onChange,
}: Props) {

  const [open, setOpen] = useState(false)

  const { areas } = useAreas()

  const visuals = value ? getAreaVisuals(value) : null

  return (

    <Popover open={open} onOpenChange={setOpen}>

      <PopoverTrigger className="flex w-full min-w-0 items-center">

        <DynamicBadge
          label={value?.label ?? placeholder}
          color={visuals?.color ?? "#64748B"}
          icon={visuals?.icon}
          placeholder={!value}
          width="field"
          showChevron
          chevronOpen={open}
        />

      </PopoverTrigger>

      <PopoverContent sideOffset={8} floatingClassName="w-64" className="p-2">

        <Command className="bg-transparent">

          <CommandList>

            <CommandGroup>

              {areas.map(area => {

                const optionVisuals = getAreaVisuals(area)

                return (

                  <SelectOption
                    key={area.id}
                    label={area.label}
                    icon={optionVisuals.icon}
                    color={optionVisuals.color}
                    selected={value?.id === area.id}
                    onSelect={() => {

                      onChange(
                        value?.id === area.id
                          ? null
                          : area,
                      )

                      setOpen(false)

                    }}
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
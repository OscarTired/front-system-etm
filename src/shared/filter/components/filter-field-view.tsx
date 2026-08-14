"use client"

import {
  ChevronRight,
} from "lucide-react"

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command"

import {
  SelectOption,
} from "@/shared/ui/select-option/select-option"

import type {
  FilterField,
  FilterModule,
} from "../types/filter.types"

import {
  filterConfig,
  filterFieldColors,
  filterFieldIcons,
  filterFieldLabels,
} from "../config/filter-config"

type Props={

  module:FilterModule

  onSelect:(
    field:FilterField
  )=>void

}

export function FilterFieldView({

  module,

  onSelect,

}:Props){

  return(

    <Command
      className="bg-transparent"
    >

      <CommandInput
        placeholder="Buscar filtro..."
      />

      <CommandList
        className="max-h-none overflow-visible tablet:max-h-64 tablet:overflow-y-auto"
      >

        <CommandGroup>

          {filterConfig[module].map(
            field=>(

            <SelectOption
              key={field}
              label={filterFieldLabels[field]}
              icon={filterFieldIcons[field]}
              color={filterFieldColors[field]}
              selected={false}
              onSelect={() => onSelect(field)}
            />

            )
          )}

        </CommandGroup> 

      </CommandList>

    </Command>

  )

}
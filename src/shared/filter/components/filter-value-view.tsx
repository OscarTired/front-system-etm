"use client"

import {
  ChevronLeft,
} from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command"

import {
  SelectOption,
} from "@/shared/ui/select-option/select-option"

import {
  filterFieldLabels,
} from "../config/filter-config"

import type {
  FilterField,
  FilterOption,
} from "../types/filter.types"

type Props={

  selectedField:FilterField

  availableOptions:
    FilterOption[]

  onBack:()=>void

  onSelect:(
    option:FilterOption
  )=>void

}

export function FilterValueView({

  selectedField,

  availableOptions,

  onBack,

  onSelect,

}:Props){

  return(

    <Command
      className="bg-transparent"
    >

      <div className="mb-2 flex items-center gap-2">

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-white/60 transition-colors hover:text-white"
        >

          <ChevronLeft
            size={14}
          />

          <span className="text-xs font-semibold uppercase tracking-[0.08em]">

            {
              filterFieldLabels[
                selectedField
              ]
            }

          </span>

        </button>

      </div>

      <CommandInput
        placeholder="Buscar..."
      />

      <CommandList
        className="max-h-80 overflow-y-auto"
      >

        <CommandEmpty>

          Sin resultados

        </CommandEmpty>

        <CommandGroup>

          {availableOptions.map(
            option=>(

              <SelectOption
                key={option.value}
                label={option.label}
                icon={option.icon}
                color={
                  option.color ??
                  "#64748B"
                }
                selected={false}
                onSelect={()=>
                  onSelect(option)
                }
              />

            )
          )}

        </CommandGroup>

      </CommandList>

    </Command>

  )

}
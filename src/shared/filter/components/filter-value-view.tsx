"use client"

import { ChevronLeft } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command"
import { SelectOption } from "@/shared/ui/select-option/select-option"
import { filterFieldLabels } from "../config/filter-config"
import type { FilterField, FilterOption } from "../types/filter.types"

type Props = {
  selectedField: FilterField
  availableOptions: FilterOption[]
  selectedValues: Set<string>
  onBack: () => void
  onToggle: (option: FilterOption) => void
}

/**
 * Lista de valores de UN campo.
 * Sin max-height propio: el scroll lo hace el body del sheet
 * (un solo scroller → no pelea con Listo ni rebota al soltar).
 * Listo es global (sheetFooter).
 */
export function FilterValueView({
  selectedField,
  availableOptions,
  selectedValues,
  onBack,
  onToggle,
}: Props) {
  return (
    <Command className="bg-transparent">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-foreground/60 transition-colors hover:text-foreground"
        >
          <ChevronLeft size={14} />
          <span className="text-xs font-semibold uppercase tracking-[0.08em]">
            {filterFieldLabels[selectedField]}
          </span>
        </button>
      </div>

      <CommandInput placeholder="Buscar..." />

      {/* Sin max-h: el overflow-y del sheet body es el único scroll */}
      <CommandList className="max-h-none overflow-visible">
        <CommandEmpty>Sin resultados</CommandEmpty>
        <CommandGroup>
          {availableOptions.map(option => (
            <SelectOption
              key={option.value}
              label={option.label}
              icon={option.icon}
              color={option.color ?? "#64748B"}
              selected={selectedValues.has(option.value)}
              onSelect={() => onToggle(option)}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

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
  draft: FilterOption[]
  onBack: () => void
  onToggle: (option: FilterOption) => void
}

/**
 * Solo la lista multi-select.
 * "Listo" es global del sheet (sheetFooter en FilterBar), no de esta lista.
 */
export function FilterValueView({
  selectedField,
  availableOptions,
  draft,
  onBack,
  onToggle,
}: Props) {
  const selectedValues = new Set(draft.map(o => o.value))

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

      <CommandList className="max-h-[min(50dvh,22rem)] overflow-y-auto overscroll-contain">
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

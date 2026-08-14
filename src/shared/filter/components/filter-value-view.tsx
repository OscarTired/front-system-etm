"use client"

import { useEffect, useState } from "react"
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
  onBack: () => void
  /** Aplica la selección y cierra el sheet (solo al pulsar Listo). */
  onConfirm: (options: FilterOption[]) => void
}

/**
 * Multi-selección diferida: los checks son locales hasta "Listo".
 * Volver / cerrar el sheet sin Listo descarta el borrador.
 * Patrón correcto en mobile para filtros (no anti-patrón).
 */
export function FilterValueView({
  selectedField,
  availableOptions,
  onBack,
  onConfirm,
}: Props) {
  const [draft, setDraft] = useState<FilterOption[]>([])

  // Al cambiar de campo, borrador limpio
  useEffect(() => {
    setDraft([])
  }, [selectedField])

  const toggle = (option: FilterOption) => {
    setDraft(prev => {
      const exists = prev.some(o => o.value === option.value)
      if (exists) return prev.filter(o => o.value !== option.value)
      return [...prev, option]
    })
  }

  const selectedValues = new Set(draft.map(o => o.value))

  return (
    <div className="flex min-h-0 flex-col">
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

        <CommandList className="max-h-80 overflow-y-auto">
          <CommandEmpty>Sin resultados</CommandEmpty>
          <CommandGroup>
            {availableOptions.map(option => (
              <SelectOption
                key={option.value}
                label={option.label}
                icon={option.icon}
                color={option.color ?? "#64748B"}
                selected={selectedValues.has(option.value)}
                onSelect={() => toggle(option)}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      <div className="mt-3 shrink-0 border-t border-border/40 pt-3">
        <button
          type="button"
          disabled={draft.length === 0}
          onClick={() => onConfirm(draft)}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition enabled:active:scale-[0.99] disabled:opacity-40"
        >
          Listo{draft.length > 0 ? ` (${draft.length})` : ""}
        </button>
      </div>
    </div>
  )
}

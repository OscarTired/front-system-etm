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
 * Multi-selección diferida: checks locales hasta "Listo".
 * Volver / cerrar sin Listo descarta el borrador.
 *
 * Layout: lista scrolleable + footer sticky (Listo siempre visible
 * dentro del sheet, no se pierde al final del scroll).
 */
export function FilterValueView({
  selectedField,
  availableOptions,
  onBack,
  onConfirm,
}: Props) {
  const [draft, setDraft] = useState<FilterOption[]>([])

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
      <Command className="flex min-h-0 flex-col bg-transparent">
        <div className="mb-2 flex shrink-0 items-center gap-2">
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

        <CommandList className="max-h-[min(42dvh,18rem)] overflow-y-auto overscroll-contain">
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

      {/* Sticky respecto al body del sheet (scroll del popover-content) */}
      <div className="sticky bottom-0 z-10 -mx-2 mt-2 border-t border-border/50 bg-popover px-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
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

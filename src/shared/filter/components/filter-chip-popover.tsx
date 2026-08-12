"use client"

import { Trash2 } from "lucide-react"

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
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { SelectOption } from "@/shared/ui/select-option/select-option"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { filterFieldLabels } from "../config/filter-config"
import type { FilterChip, FilterOption } from "../types/filter.types"

type Props = {
  chip: FilterChip
  options: FilterOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (option: FilterOption) => void
  onRemove: () => void
}

/**
 * Chip de filtro activo.
 *
 * Desktop: X en el badge (hover) + edición en popover.
 * Mobile: sin X — tap abre sheet; "Quitar filtro" con área táctil grande.
 */
export function FilterChipPopover({
  chip,
  options,
  open,
  onOpenChange,
  onSelect,
  onRemove,
}: Props) {
  const { isMobile } = useResponsive()

  function handleRemove() {
    onRemove()
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button type="button">
          <DynamicBadge
            compact
            showChevron
            showRemove={!isMobile}
            reserveActionsSpace
            onRemove={!isMobile ? handleRemove : undefined}
            chevronOpen={open}
            label={chip.label}
            color={chip.color ?? "#64748B"}
            icon={chip.icon}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        floatingClassName="w-72"
        className="p-2"
      >
        <div className="mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">
            {filterFieldLabels[chip.field]}
          </span>
        </div>

        <Command className="bg-transparent">
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandEmpty>Sin resultados</CommandEmpty>

            <CommandGroup>
              {options.map(option => (
                <SelectOption
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  color={option.color ?? "#64748B"}
                  selected={option.value === chip.value}
                  onDelete={
                    option.value === chip.value ? handleRemove : undefined
                  }
                  onSelect={() => onSelect(option)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {isMobile && (
          <button
            type="button"
            onClick={handleRemove}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 text-sm font-semibold text-rose-300 transition active:bg-rose-500/20"
          >
            <Trash2 size={16} strokeWidth={2.2} />
            Quitar filtro
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

"use client"

import { useRef } from "react"
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

/** ms para “mantener pulsado = quitar” en mobile */
const LONG_PRESS_MS = 420

/**
 * Chip de filtro activo.
 *
 * Mobile:
 *  - tap → abre sheet (cambiar valor)
 *  - long-press → quita el filtro (un gesto, sin sheet)
 * Desktop:
 *  - X en el badge / menú
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
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  function clearLongPress() {
    if (longPressTimer.current != null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleRemove() {
    onRemove()
    onOpenChange(false)
  }

  function onPointerDown() {
    if (!isMobile) return
    longPressFired.current = false
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      handleRemove()
      // feedback táctil si el device lo soporta
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(12)
      }
    }, LONG_PRESS_MS)
  }

  function onPointerUpOrCancel() {
    clearLongPress()
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        // Si el long-press ya quitó el filtro, no abrir el sheet
        if (next && longPressFired.current) {
          longPressFired.current = false
          return
        }
        onOpenChange(next)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title={isMobile ? "Mantén pulsado para quitar" : undefined}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUpOrCancel}
          onPointerLeave={onPointerUpOrCancel}
          onPointerCancel={onPointerUpOrCancel}
          onContextMenu={e => {
            // Evita menú nativo; el long-press ya quita
            if (isMobile) e.preventDefault()
          }}
        >
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
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
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
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-sm font-semibold text-destructive transition hover:bg-destructive/15 active:bg-destructive/20"
          >
            <Trash2 size={16} strokeWidth={2.2} />
            Quitar filtro
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

"use client"

import { memo, useCallback } from "react"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"
import { useDomainInk } from "@/shared/utils/use-badge-colors"
import type { ProcessCode } from "@/features/tasks/types/task.types"

type AreaFilterChipsProps = {
  allAreas: ProcessCode[]
  selectedAreas: ProcessCode[]
  onChange: (next: ProcessCode[]) => void
  className?: string
}

type AreaChipProps = {
  code: ProcessCode
  selected: boolean
  onToggle: (code: ProcessCode) => void
}

const AreaChip = memo(function AreaChip({
  code,
  selected,
  onToggle,
}: AreaChipProps) {
  const definition = PROCESS_DEFINITIONS[code]
  const Icon = ENTITY_ICONS[definition.icon as keyof typeof ENTITY_ICONS]
  const ink = useDomainInk(definition.color)

  const handleClick = useCallback(() => {
    onToggle(code)
  }, [code, onToggle])

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={handleClick}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        selected
          ? "bg-foreground/15 text-foreground shadow-2xs"
          : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground dark:bg-foreground/5 dark:hover:bg-foreground/10"
      )}
    >
      {Icon && (
        <span className="flex shrink-0 items-center justify-center">
          <Icon
            size={13}
            strokeWidth={2.5}
            className="block transition-opacity duration-150"
            style={{ color: ink }}
          />
        </span>
      )}
      <span className="leading-none">{definition.label}</span>
    </button>
  )
})

export function AreaFilterChips({
  allAreas,
  selectedAreas,
  onChange,
  className,
}: AreaFilterChipsProps) {
  const handleToggleCode = useCallback(
    (code: ProcessCode) => {
      const isOnlySelected =
        selectedAreas.length === 1 && selectedAreas[0] === code
      onChange(isOnlySelected ? [] : [code])
    },
    [selectedAreas, onChange]
  )

  return (
    <div
      role="group"
      aria-label="Filtro por área de trabajo"
      className={cn(
        "rounded-xl bg-muted/60 p-1.5 shadow-2xs dark:bg-muted/80",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {allAreas.map((code) => (
          <AreaChip
            key={code}
            code={code}
            selected={selectedAreas.includes(code)}
            onToggle={handleToggleCode}
          />
        ))}
      </div>
    </div>
  )
}
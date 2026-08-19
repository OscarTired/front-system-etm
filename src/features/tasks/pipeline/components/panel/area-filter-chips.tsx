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

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(code)}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-150 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        selected
          ? "bg-foreground/15 text-foreground"
          : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
      )}
    >
      {Icon && (
        <Icon
          size={13}
          strokeWidth={2.5}
          className="block shrink-0 transition-colors duration-150"
          style={{ color: ink }}
        />
      )}
      <span>{definition.label}</span>
    </button>
  )
})

export function AreaFilterChips({
  allAreas,
  selectedAreas,
  onChange,
  className,
}: AreaFilterChipsProps) {
  const handleToggle = useCallback(
    (code: ProcessCode) => {
      const isOnlySelected =
        selectedAreas.length === 1 && selectedAreas[0] === code
      onChange(isOnlySelected ? [] : [code])
    },
    [selectedAreas, onChange]
  )

  return (
    <div className={cn("rounded-xl bg-foreground/5 p-2", className)}>
      <div className="flex flex-wrap justify-center gap-1.5">
        {allAreas.map((code) => (
          <AreaChip
            key={code}
            code={code}
            selected={selectedAreas.includes(code)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
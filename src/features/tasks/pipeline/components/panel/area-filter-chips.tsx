"use client"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { cn } from "@/shared/utils/utils"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import type { ProcessCode } from "@/features/tasks/types/task.types"

type Props = {
  allAreas: ProcessCode[]
  /** Vacío = todas visibles. */
  selectedAreas: ProcessCode[]
  onChange: (next: ProcessCode[]) => void
  className?: string
}

function AreaChip({
  code,
  selected,
  onToggle,
}: {
  code: ProcessCode
  selected: boolean
  onToggle: () => void
}) {
  const definition = PROCESS_DEFINITIONS[code]
  const Icon = ENTITY_ICONS[definition.icon]
  const badge = useBadgeColors(definition.color, "subtle")

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95",
        selected
          ? "bg-foreground/15 text-foreground"
          : "bg-background/40 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
      )}
    >
      <Icon size={13} style={{ color: selected ? badge.text : undefined }} className={cn(!selected && "text-muted-foreground")} />
      <span>{definition.label}</span>
    </button>
  )
}

/**
 * Selector de áreas (Mis tareas).
 * - Una sola área a la vez; clic de nuevo → todas (array vacío).
 * - Chips centrados.
 * Iconos de proceso: mismo motor badge-colors que EntityChip / columnas.
 */
export function AreaFilterChips({
  allAreas,
  selectedAreas,
  onChange,
  className,
}: Props) {
  function toggle(code: ProcessCode) {
    const onlyThis =
      selectedAreas.length === 1 && selectedAreas[0] === code
    onChange(onlyThis ? [] : [code])
  }

  function isSelected(code: ProcessCode) {
    return selectedAreas.length === 0
      ? true
      : selectedAreas.includes(code)
  }

  return (
    <div className={cn("rounded-xl bg-foreground/5 p-2", className)}>
      <div className="flex flex-wrap justify-center gap-1.5">
        {allAreas.map(code => (
          <AreaChip
            key={code}
            code={code}
            selected={isSelected(code)}
            onToggle={() => toggle(code)}
          />
        ))}
      </div>
    </div>
  )
}

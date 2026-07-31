"use client"

import { useState } from "react"
import { Users } from "lucide-react"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"

import { SelectOption } from "@/shared/ui/select-option/select-option"

import { useAreaOperators } from "@/features/areas/hooks/use-area-operators"
import { cn } from "@/shared/utils/utils"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  processCode: ProcessCode
  active?: boolean
  // El operario ya elegido para ESTA convocatoria — si se reabre el
  // popover (para cambiarlo), se ve marcado con el check clásico en
  // vez de perderse esa info.
  selectedOperatorId?: string
  // undefined = deseleccionar (tocar al que ya estaba elegido lo
  // destilda) — mismo patrón que UserSelect.
  onSelect: (operator: User | undefined) => void
}

const STATUS_COLOR: Record<string, string> = {
  FREE: "#10B981",
  WORKING: "#F59E0B",
  PAUSED: "#737373",
  INVITED: "#38BDF8",
}

const STATUS_LABEL: Record<string, string> = {
  FREE: "Libre",
  WORKING: "Trabajando",
  PAUSED: "Pausado",
  INVITED: "Ya convocado",
}

// Mismo patrón clásico que UserSelect/EntitySelect (Popover +
// Command + SelectOption) en vez de una lista armada a mano — así
// se ve igual de consistente que el resto de la app, con su propio
// check de selección incluido, no uno reinventado acá.
export function SummonOperatorButton({ processCode, active, selectedOperatorId, onSelect }: Props) {

  const [open, setOpen] = useState(false)

  const operators = useAreaOperators(processCode)

  return (

    <Popover open={open} onOpenChange={setOpen}>

      <PopoverTrigger asChild>

        <button
          type="button"
          className={cn(
            // min-w fijo: antes el texto cambiaba entre "Convocar" y
            // "Seleccionando..." (dos anchos distintos) sin ningún
            // espacio reservado, así que el botón (y todo lo que
            // tenía al lado) saltaba de ancho cada vez que
            // cambiabas de estado. Con un ancho mínimo fijo, el
            // contenido cambia adentro de una caja que ya está.
            "flex min-w-30 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            active
              ? "bg-white/20 text-white shadow-sm"
              : "bg-white/5 text-neutral-300 hover:bg-white/10",
          )}
        >
          <Users size={13} className="shrink-0" />
          <span className="truncate">
            {active ? "Seleccionando…" : "Convocar"}
          </span>
        </button>

      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" floatingClassName="w-72" className="p-2">

        <Command>

          <CommandList className="max-h-64 overflow-y-auto">

            <CommandEmpty>
              No hay operarios en esta área todavía.
            </CommandEmpty>

            <CommandGroup>

              {operators.map(({ user, availability }) => (

                <SelectOption
                  key={user.id}
                  label={user.name}
                  icon={user.icon}
                  color={user.color ?? "#64748B"}
                  selected={selectedOperatorId === user.id}
                  description={
                    availability.state === "FREE"
                      ? "Libre"
                      : `${STATUS_LABEL[availability.state]} · ${availability.taskLabel}`
                  }
                  descriptionColor={STATUS_COLOR[availability.state]}
                  onSelect={() => {

                    const isDeselecting =
                      selectedOperatorId === user.id

                    onSelect(isDeselecting ? undefined : user)
                    setOpen(false)

                  }}
                />

              ))}

            </CommandGroup>

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>

  )

}
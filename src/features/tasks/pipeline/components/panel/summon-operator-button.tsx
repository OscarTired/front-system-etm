"use client"

import { useState } from "react"
import { Users } from "lucide-react"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

import { useAreaOperators } from "@/features/areas/hooks/use-area-operators"
import { cn } from "@/shared/utils/utils"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  processCode: ProcessCode
  active?: boolean // <-- Añadido aquí
  onSelect: (operator: User) => void
}

const STATUS_DOT: Record<string, string> = {
  FREE: "bg-emerald-500",
  WORKING: "bg-amber-500",
  PAUSED: "bg-neutral-500",
  INVITED: "bg-sky-500",
}

const STATUS_LABEL: Record<string, string> = {
  FREE: "Libre",
  WORKING: "Trabajando",
  PAUSED: "Pausado",
  INVITED: "Ya convocado",
}

export function SummonOperatorButton({ processCode, active, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const operators = useAreaOperators(processCode)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            active 
              ? "bg-white/20 text-white shadow-sm" 
              : "bg-white/5 text-neutral-300 hover:bg-white/10"
          )}
        >
          <Users size={13} />
          {active ? "Seleccionando..." : "Convocar"}
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" className="w-72 p-1.5">
        {operators.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-neutral-500">
            No hay operarios en esta área todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {operators.map(({ user, availability }) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelect(user)
                  setOpen(false)
                }}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/6"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    STATUS_DOT[availability.state],
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-200">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {availability.state === "FREE"
                      ? "Libre"
                      : `${STATUS_LABEL[availability.state]} · ${availability.taskLabel}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
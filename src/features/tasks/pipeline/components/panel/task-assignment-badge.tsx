"use client"

import { UserCheck, Clock3, X } from "lucide-react"

import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { cn } from "@/shared/utils/utils"

import type { WorkflowStep } from "@/features/workflow/types/workflow.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  step: WorkflowStep
  onUnsummon: (stepId: string) => void
  unsummoning?: boolean
}

// Se muestra en la esquina opuesta al checkbox de selección (ver
// task-process-column.tsx) — solo visible para quien puede convocar
// (canChooseAreas), y solo fuera del modo selección: mientras se
// está eligiendo tareas para UNA convocatoria nueva, no tiene
// sentido mezclar el estado de una convocatoria vieja encima.
export function TaskAssignmentBadge({ step, onUnsummon, unsummoning }: Props) {

  const { users } = useUsersDirectory()

  const invited = step.invitedOperatorId
    ? (users as User[]).find(u => u.id === step.invitedOperatorId)
    : null

  const assigned = !invited && step.assignedById
    ? (users as User[]).find(u => u.id === step.operatorId)
    : null

  if (!invited && !assigned) {
    return null
  }

  const person = invited ?? assigned

  return (

    <div
      className={cn(
        "animate-fade-in absolute left-2.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium backdrop-blur-sm",
        invited ? "bg-sky-500/20 text-sky-300" : "bg-emerald-500/20 text-emerald-300",
      )}
    >

      {invited ? <Clock3 size={11} /> : <UserCheck size={11} />}

      <span className="max-w-20 truncate">
        {person?.name ?? "—"}
      </span>

      <button
        type="button"
        disabled={unsummoning}
        onClick={(e) => {
          e.stopPropagation()
          onUnsummon(step.id)
        }}
        aria-label="Deshacer convocatoria"
        className="flex size-3.5 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 disabled:opacity-30"
      >
        <X size={11} />
      </button>

    </div>

  )

}
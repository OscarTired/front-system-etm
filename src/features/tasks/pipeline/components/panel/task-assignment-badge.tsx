"use client"

import { UserCheck, Clock3, X } from "lucide-react"

import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"

import type { WorkflowStep } from "@/features/workflow/types/workflow.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  step: WorkflowStep
  onUnsummon: (stepId: string) => void
  unsummoning?: boolean
}

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
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity",
        invited 
          ? "bg-sky-500/10 text-sky-300" 
          : "bg-emerald-500/22 dark:bg-emerald-500/10 text-emerald-300",
        unsummoning && "opacity-60 pointer-events-none"
      )}
    >
      {invited ? <Clock3 size={12} className="shrink-0" /> : <UserCheck size={12} className="shrink-0" />}

      <span className="max-w-18 truncate">
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
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
          invited 
            ? "hover:bg-sky-500/20 text-sky-400 hover:text-sky-200" 
            : "hover:bg-emerald-500/30 dark:bg-emerald-500/20 text-emerald-400 hover:text-emerald-200",
          "disabled:opacity-50"
        )}
      >
        {unsummoning ? (
          <Spinner size={10} className={invited ? "text-sky-300" : "text-emerald-300"} />
        ) : (
          <X size={12} strokeWidth={2.5} />
        )}
      </button>
    </div>
  )
}
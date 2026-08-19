"use client"

import { useMemo, useState } from "react"
import { UserCheck, Clock3, X, UserRoundCog, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { useAreaOperators } from "@/features/areas/hooks/use-area-operators"
import { useWorkflowSummon } from "@/features/workflow/hooks/use-workflow-summon"
import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { WorkflowStep } from "@/features/workflow/types/workflow.types"
import type { User } from "@/features/users/types/user.types"

type Props = {
  step: WorkflowStep
  onUnsummon: (stepId: string) => void
  unsummoning?: boolean
}

export function TaskAssignmentBadge({ step, onUnsummon, unsummoning }: Props) {
  const { users } = useUsersDirectory()
  const operators = useAreaOperators(step.processCode)
  const { reassign, reassigning } = useWorkflowSummon()
  const [open, setOpen] = useState(false)

  const invited = step.invitedOperatorId
    ? (users as User[]).find(u => u.id === step.invitedOperatorId)
    : null

  const assigned =
    !invited && step.assignedById
      ? (users as User[]).find(u => u.id === step.operatorId)
      : null

  const person = invited ?? assigned
  const busy = unsummoning || reassigning
  const currentId = person?.id

  const candidates = useMemo(
    () =>
      operators
        .map(o => o.user)
        .filter(u => u.id !== currentId),
    [operators, currentId],
  )

  if (!person) {
    return null
  }

  async function handleReassign(user: User) {
    try {
      await reassign({ stepId: step.id, operatorId: user.id })
      toast.success(`Reasignado a ${user.name}`)
      setOpen(false)
    } catch {
      // interceptor global
    }
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium transition-opacity",
        invited
          ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
          : "bg-emerald-500/22 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
        busy && "pointer-events-none opacity-60",
      )}
    >
      {invited ? (
        <Clock3 size={12} className="shrink-0" />
      ) : (
        <UserCheck size={12} className="shrink-0" />
      )}

      <span className="max-w-18 truncate px-1">{person.name}</span>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            aria-label="Opciones de asignación"
            onClick={e => e.stopPropagation()}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
              invited
                ? "hover:bg-sky-500/20"
                : "hover:bg-emerald-500/30 dark:hover:bg-emerald-500/20",
            )}
          >
            {busy ? (
              <Spinner size={10} />
            ) : (
              <ChevronDown size={12} strokeWidth={2.5} />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-44"
          onClick={e => e.stopPropagation()}
        >
          {!invited && candidates.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cambiar operario
              </div>
              {candidates.map(user => (
                <DropdownMenuItem
                  key={user.id}
                  onSelect={() => void handleReassign(user)}
                  className="gap-2"
                >
                  <UserRoundCog size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{user.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onSelect={() => onUnsummon(step.id)}
            className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400"
          >
            <X size={14} className="shrink-0" />
            {invited ? "Cancelar invitación" : "Desconvocar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

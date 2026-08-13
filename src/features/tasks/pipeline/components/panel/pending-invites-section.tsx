"use client"

import { Check, X } from "lucide-react"

import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { useWorkflowSummon } from "@/features/workflow/hooks/use-workflow-summon"

import type { Task } from "@/features/tasks/types/task.types"

type Props = {
  tasks: Task[]
  currentUserId: string
}

type Invite = {
  stepId: string
  taskId: string
  reference: string
  taskNumber: number
  processCode: Task["workflowSteps"][number]["processCode"]
}

// "Convocar" modo INVITE (ver TaskWorkflowOverlay/SummonConfirmBar):
// el operatorId todavía NO se tocó, solo queda pendiente de que ESTE
// usuario la acepte o la rechace. Se muestra arriba de todo el panel
// — a diferencia del resto de "Mis tareas", esto no depende de qué
// área tenga elegida ahora mismo, es sobre lo que le llegó a él en
// particular.
export function PendingInvitesSection({ tasks, currentUserId }: Props) {

  const { acceptInvite, declineInvite, accepting, declining } = useWorkflowSummon()

  const invites: Invite[] = tasks.flatMap(task =>
    task.workflowSteps
      .filter(step => step.invitedOperatorId === currentUserId)
      .map(step => ({
        stepId: step.id,
        taskId: task.id,
        reference: task.reference,
        taskNumber: task.taskNumber,
        processCode: step.processCode,
      })),
  )

  if (invites.length === 0) {
    return null
  }

  return (

    <div className="flex flex-col gap-2 rounded-2xl bg-sky-500/8 p-3 ring-1 ring-sky-500/20">

      <span className="px-1 text-xs font-bold uppercase tracking-wide text-sky-300">
        Te convocaron · {invites.length}
      </span>

      <div className="flex flex-col gap-2">

        {invites.map(invite => {

          const definition = PROCESS_DEFINITIONS[invite.processCode]
          const Icon = ENTITY_ICONS[definition.icon]

          return (

            <div
              key={invite.stepId}
              className="animate-comment-in flex items-center gap-3 rounded-xl bg-foreground/5 p-3"
            >

              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${definition.color}22`, color: definition.color }}
              >
                <Icon size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  #{String(invite.taskNumber).padStart(3, "0")} {invite.reference}
                </p>
                <p className="text-xs text-muted-foreground">
                  {definition.label}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">

                <button
                  type="button"
                  disabled={declining}
                  onClick={() => declineInvite(invite.stepId)}
                  aria-label="Rechazar"
                  className="flex size-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                >
                  <X size={15} />
                </button>

                <button
                  type="button"
                  disabled={accepting}
                  onClick={() => acceptInvite(invite.stepId)}
                  aria-label="Aceptar"
                  className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/26 dark:bg-emerald-500/15 text-emerald-300 transition-colors hover:bg-emerald-500/32 dark:bg-emerald-500/25 disabled:opacity-40"
                >
                  <Check size={15} />
                </button>

              </div>

            </div>

          )

        })}

      </div>

    </div>

  )

}
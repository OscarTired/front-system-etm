"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  UserSelect,
} from "@/features/users/components/user-select"

import {
  useUsersDirectory,
} from "@/features/users/hooks/use-users-directory"

import {
  useWorkflowStepField,
} from "@/features/workflow/hooks/use-workflow-step-field"

import {
  workflowAccess,
} from "@/features/workflow/access/workflow-access"

import type { Task } from "@/features/tasks/types/task.types"
import type {
  ProcessTask,
} from "../../types/process.types"

type Props={
  processTask:ProcessTask
  // Avisa al padre cuando el guardado del operario está en curso —
  // mismo patrón que WorkflowNumericField.onSavingChange. Sin esto,
  // nada le decía a "Iniciar" que esperara a que este guardado
  // terminara, permitiendo iniciar el step con el operario todavía
  // sin confirmarse en el backend.
  onSavingChange?:(saving:boolean)=>void
  // Mismo patrón que TaskPriorityCell/ProjectPmCell: "row" para la
  // fila compacta dentro del panel de campos expandido de la card
  // mobile (ProcessMobileCard). Sin esto, no había forma de pedirle
  // a UserSelect el trigger de fila — siempre caía en "badge".
  triggerVariant?:"badge"|"row"
  rowLabel?:string
}

// Mismo criterio que WorkflowService.update() en el backend
// (validateEditable): una vez completado, el step deja de ser editable
// hasta que se reabra explícitamente.
const NON_EDITABLE_STATUSES=[
  "COMPLETED",
  "REVIEWED",
] as const

export function ProcessOperatorCell({
  processTask,
  onSavingChange,
  triggerVariant,
  rowLabel,
}:Props){

  const queryClient = useQueryClient()

  const{
    users,
  }=useUsersDirectory()

  const updateField=
    useWorkflowStepField()

  const currentOperatorId =
    workflowAccess.operator(processTask)?.id

  const currentStepId =
    workflowAccess.stepId(processTask)

  const status =
    workflowAccess.status(processTask)

  const isEditable =
    !NON_EDITABLE_STATUSES.includes(
      status as typeof NON_EDITABLE_STATUSES[number],
    )

  // Operarios ocupados: tienen un step en PROGRESS
  // en un step distinto al actual.
  const busyOperatorIds = useMemo(() => {

    const tasks =
      queryClient.getQueryData<Task[]>(["tasks"]) ?? []

    const busy = new Set<string>()

    for (const task of tasks) {

      for (const step of task.workflowSteps) {

        if (
          step.status === "PROGRESS" &&
          step.operatorId &&
          step.id !== currentStepId
        ) {
          busy.add(step.operatorId)
        }

      }

    }

    return busy

  }, [queryClient, currentStepId])

  const operators =
    users
      .filter(user => user.roles?.some(role => role.code === "PRODUCCION") && user.level === "OPERARIO")
      .filter(user =>
        // Siempre mostramos el operario ya asignado a este step,
        // aunque esté en PROGRESS (puede ser el mismo que estamos editando).
        user.id === currentOperatorId ||
        !busyOperatorIds.has(user.id)
      )

  return(

    <UserSelect
      value={
        workflowAccess.operator(processTask)??undefined
      }
      items={operators}
      placeholder="Operario"
      disabled={!isEditable}
      triggerVariant={triggerVariant}
      rowLabel={rowLabel}
      onChange={async user=>{

        if(!currentStepId||!isEditable){
          return
        }

        onSavingChange?.(true)

        try{

          await updateField(

            currentStepId,

            {
              operatorId:user?.id??null,
            },

            {
              operator:user??null,
              operatorId:user?.id??null,
            },

          )

        }finally{

          onSavingChange?.(false)

        }

      }}
    />

  )

}
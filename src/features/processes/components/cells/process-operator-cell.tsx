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
  onSavingChange?:(saving:boolean)=>void
  triggerVariant?:"badge"|"row"
  rowLabel?:string
}

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

  // Obtenemos el processCode directamente usando el workflowAccess que me pasaste
  const currentProcessCode = workflowAccess.processCode(processTask)

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

  const operators = useMemo(() => {

    return users
      .filter(user => user.roles?.some(role => role.code === "PRODUCCION") && user.level === "OPERARIO")
      // Filtramos por el área/proceso correcto usando workflowAccess.processCode(item)
      .filter(user => {
        if (!currentProcessCode) return true
        return user.areas?.some(area => area.processCode === currentProcessCode)
      })
      .filter(user =>
        // Siempre mostramos el operario ya asignado a este step,
        // aunque esté en PROGRESS (puede ser el mismo que estamos editando).
        user.id === currentOperatorId ||
        !busyOperatorIds.has(user.id)
      )

  }, [users, currentProcessCode, currentOperatorId, busyOperatorIds])

  return(

    <UserSelect
      value={
        workflowAccess.operator(processTask)??undefined
      }
      items={operators}
      placeholder="Asignar operario"
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
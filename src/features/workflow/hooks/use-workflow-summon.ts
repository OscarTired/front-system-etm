"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { workflowService } from "../services/workflow.services"

// Sin optimistic update propio a propósito: summon puede tocar
// varias tareas de golpe (selección múltiple desde TaskAreaPanel),
// y ya existe la propagación por realtime (WorkflowService.summon
// publica un WORKFLOW/UPDATED por cada tarea afectada) — con eso
// alcanza para que se vea reflejado sin tener que replicar acá el
// patching anidado que sí necesitan start/pause/complete (más
// frecuentes, más sensibles a latencia).
export function useWorkflowSummon() {

  const queryClient = useQueryClient()

  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks"] })

  const summon = useMutation({
    mutationFn: workflowService.summon,
    onSuccess: invalidateTasks,
  })

  const acceptInvite = useMutation({
    mutationFn: workflowService.acceptInvite,
    onSuccess: invalidateTasks,
  })

  const declineInvite = useMutation({
    mutationFn: workflowService.declineInvite,
    onSuccess: invalidateTasks,
  })

  return {
    summon: summon.mutateAsync,
    summoning: summon.isPending,
    acceptInvite: acceptInvite.mutateAsync,
    accepting: acceptInvite.isPending,
    declineInvite: declineInvite.mutateAsync,
    declining: declineInvite.isPending,
  }

}
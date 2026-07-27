"use client"

import type { RealtimeEvent } from "../types/realtime-event"
import type { WorkflowResponse } from "@/features/workflow/services/workflow.services"

import { getQueryClient } from "@/lib/query-client"
import { propagateWorkflowUpdate } from "@/features/workflow/cache/propagate-workflow-update"
import { sidebarCountsQueryKey } from "@/shared/responsive/layout/hooks/use-sidebar-counts"

export function processHandler(
  event: RealtimeEvent,
) {

  const queryClient = getQueryClient()

  switch (event.action) {

    case "UPDATED": {

      propagateWorkflowUpdate(
        queryClient,
        event.payload as WorkflowResponse,
      )

      // Mismo criterio que workflow-handler.ts: un cambio de proceso
      // puede mover un item entre columnas del sidebar (conteos por
      // estado), así que hay que invalidar los conteos también —
      // sin esto, el sidebar queda desactualizado hasta un refresh.
      queryClient.invalidateQueries({
        queryKey: sidebarCountsQueryKey,
      })

      return

    }

  }

}
"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useEntityModule } from "@/shared/core/entity/use-entity-module"
import { statusesService } from "../services/statuses.service"
import { propagateStatusUpdate } from "../cache/propagate-status-update"
import type { Status } from "../types/status.types"
import type { EntityForm } from "@/shared/ui/entity-dialog/entity-dialog.types"

export function useStatuses() {
  const queryClient = useQueryClient()

  const { items, loading, create, update, remove } = useEntityModule<
    Status,
    EntityForm,
    EntityForm
  >("statuses", statusesService)

  const updateStatus = async (input: {
    id: string
    dto: EntityForm
    optimistic?: Partial<Status>
  }) => {
    const status = await update(input)
    propagateStatusUpdate(queryClient, status)
    return status
  }

  return {
    statuses: items,
    loading,
    create,
    update: updateStatus,
    remove,
  }
}

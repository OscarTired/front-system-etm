"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useEntityModule } from "@/shared/core/entity/use-entity-module"
import { prioritiesService } from "../services/priorities.service"
import { propagatePriorityUpdate } from "../cache/propagate-priority-update"
import type { Priority } from "../types/priority.types"
import type { EntityForm } from "@/shared/ui/entity-dialog/entity-dialog.types"

export function usePriorities() {
  const queryClient = useQueryClient()

  const { items, loading, create, update, remove } = useEntityModule<
    Priority,
    EntityForm,
    EntityForm
  >("priorities", prioritiesService)

  const updatePriority = async (input: {
    id: string
    dto: EntityForm
    optimistic?: Partial<Priority>
  }) => {
    const priority = await update(input)
    propagatePriorityUpdate(queryClient, priority)
    return priority
  }

  return {
    priorities: items,
    loading,
    create,
    update: updatePriority,
    remove,
  }
}

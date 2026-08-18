"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useEntityModule } from "@/shared/core/entity/use-entity-module"
import { stagesService } from "../services/stages.service"
import { propagateStageUpdate } from "../cache/propagate-stage-update"
import type { Stage } from "../types/stage.types"
import type { EntityForm } from "@/shared/ui/entity-dialog/entity-dialog.types"

export function useStages() {
  const queryClient = useQueryClient()

  const { items, loading, create, update, remove } = useEntityModule<
    Stage,
    EntityForm,
    EntityForm
  >("stages", stagesService)

  const updateStage = async (input: {
    id: string
    dto: EntityForm
    optimistic?: Partial<Stage>
  }) => {
    const stage = await update(input)
    propagateStageUpdate(queryClient, stage)
    return stage
  }

  return {
    stages: items,
    loading,
    create,
    update: updateStage,
    remove,
  }
}

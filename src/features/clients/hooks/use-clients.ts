"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useEntityModule } from "@/shared/core/entity/use-entity-module"
import { replaceEntity } from "@/shared/core/entity/cache/replace-entity"
import { addEntity } from "@/shared/core/entity/cache/add-entity"
import { removeEntity } from "@/shared/core/entity/cache/remove-entity"

import { clientsService } from "../services/clients.service"
import { propagateClientUpdate } from "../cache/propagate-client-update"
import type { Client } from "../types/client.types"
import type { EntityForm } from "@/shared/ui/entity-dialog/entity-dialog.types"

export function useClients() {
  const queryClient = useQueryClient()

  const { items, loading, create, update, remove } = useEntityModule<
    Client,
    EntityForm,
    EntityForm
  >("clients", clientsService, {
    onCreate: addEntity,
    onUpdate: replaceEntity,
    onRemove: removeEntity,
  })

  const updateClient = async (input: {
    id: string
    dto: EntityForm
    optimistic?: Partial<Client>
  }) => {
    const client = await update(input)
    propagateClientUpdate(queryClient, client)
    return client
  }

  return {
    clients: items,
    loading,
    create,
    update: updateClient,
    remove,
  }
}

"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useEntityModule } from "@/shared/core/entity/use-entity-module"
import { replaceEntity } from "@/shared/core/entity/cache/replace-entity"
import { removeEntity } from "@/shared/core/entity/cache/remove-entity"

import { clientsService } from "../services/clients.service"
import { propagateClientUpdate } from "../cache/propagate-client-update"
import type { Client } from "../types/client.types"
import type { EntityForm } from "@/shared/ui/entity-dialog/entity-dialog.types"

/** Clientes no tienen `position` — no usar addEntity (exige position). */
function appendClient(items: Client[], created: Client): Client[] {
  if (items.some(i => i.id === created.id)) {
    return items.map(i => (i.id === created.id ? created : i))
  }
  return [...items, created]
}

export function useClients() {
  const queryClient = useQueryClient()

  const { items, loading, create, update, remove } = useEntityModule<
    Client,
    EntityForm,
    EntityForm
  >("clients", clientsService, {
    onCreate: appendClient,
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

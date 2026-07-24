"use client"

import { Users } from "lucide-react"

import { FormSection } from "@/shared/ui/dialogs/form-dialog/form-section"
import { FormField } from "@/shared/ui/dialogs/form-dialog/form-field"

import { EntitySelect } from "@/shared/ui/entity-select/entity-select"
import { UserSelect } from "@/features/users/components/user-select"

import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { isProjectManager } from "@/features/users/utils/is-project-manager"
import { useClients } from "@/features/clients/hooks/use-clients"

import type { ProjectFormSectionProps } from "./types"

export function ProjectRelationsSection({
  form,
  update,
  errors,
}: ProjectFormSectionProps) {

  const { clients, create, update: updateClient, remove: removeClient } = useClients()
  const { users } = useUsersDirectory()

  const pms = users.filter(isProjectManager)

  const selectedClient = clients.find((i) => i.id === form.clientId)
  const selectedPm = pms.find((i) => i.id === form.pmId)

  return (

    <FormSection title="Relaciones" icon={Users}>

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">

        <FormField label="Cliente *" error={errors?.clientId}>
          <EntitySelect
            collection="clients"
            value={selectedClient}
            items={clients}
            placeholder="Cliente"
            onChange={(v) =>
              update({ clientId: v?.id ?? "" })
            }
            onCreate={create}
            onEdit={updateClient}
            onDelete={removeClient}
          />
        </FormField>

        <FormField label="Project Manager *" error={errors?.pmId}>
          <UserSelect
            value={selectedPm}
            items={pms}
            placeholder="PM"
            onChange={(v) =>
              update({ pmId: v?.id ?? "" })
            }
          />
        </FormField>

      </div>

    </FormSection>

  )

}
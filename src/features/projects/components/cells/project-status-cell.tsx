"use client"

import { toast } from "sonner"

import {
  EntitySelect,
} from "@/shared/ui/entity-select/entity-select"

import {
  PermissionCode,
} from "@/shared/core/enums/permission-code.enum"

import {
  usePermissions,
} from "@/features/permissions/hooks/use-permissions"

import {
  useStatuses,
} from "@/features/statuses/hooks/use-statuses"

import {
  useProjectField,
} from "../../hooks/use-project-field"

import type {
  Project,
} from "../../types/project.types"

type Props={
  project:Project
  triggerVariant?:"badge"|"row"
  rowLabel?:string
}

export function ProjectStatusCell({
  project,
  triggerVariant,
  rowLabel,
}:Props){

  const{

    statuses,

    create,

    update,

    remove,

  }=useStatuses()

  const updateField=
    useProjectField()

  const{
    has,
  }=usePermissions()

  const canUpdate=
    has(
      PermissionCode.PROJECT_UPDATE,
    )

  return(

    <EntitySelect

      collection="statuses"

      value={project.status}

      items={statuses}

      placeholder="Estado"

      disabled={!canUpdate}

      triggerVariant={triggerVariant}

      rowLabel={rowLabel}

      onChange={status=>{

        if(!status){

          return

        }

        const active =
          project.taskCount ?? 0

        if (
          status.code === "COMPLETED" &&
          active > 0
        ) {
          toast.error(
            `No se puede completar: hay ${active} tarea${active === 1 ? "" : "s"} activa${active === 1 ? "" : "s"}`,
          )
          return
        }

        updateField(

          project.id,

          {

            statusId:status.id,

          },

          {

            status,

          },

        )

      }}

      onCreate={create}

      onEdit={update}

      onDelete={remove}

    />

  )

}
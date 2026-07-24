"use client"

import {
  UserSelect,
} from "@/features/users/components/user-select"

import {
  PermissionCode,
} from "@/shared/core/enums/permission-code.enum"

import {
  usePermissions,
} from "@/features/permissions/hooks/use-permissions"

import {
  useUsersDirectory,
} from "@/features/users/hooks/use-users-directory"

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

export function ProjectPmCell({
  project,
  triggerVariant,
  rowLabel,
}:Props){

  const{
    users,
  }=useUsersDirectory()

  const updateField=
    useProjectField()

  const{
    has,
  }=usePermissions()

  const canUpdate=
    has(
      PermissionCode.PROJECT_UPDATE,
    )

  const pms=
    users.filter(
      user=>user.role?.code==="PROYECTOS",
    )

  return(

    <UserSelect

      value={project.pm}

      items={pms}

      placeholder="PM"

      disabled={!canUpdate}

      triggerVariant={triggerVariant}

      rowLabel={rowLabel}

      onChange={user=>{

        if(!user){

          return

        }

        updateField(

          project.id,

          {

            pmId:user.id,

          },

          {

            pm:user,

          },

        )

      }}

    />

  )

}
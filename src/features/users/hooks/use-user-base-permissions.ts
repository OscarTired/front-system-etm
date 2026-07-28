"use client"

import {
  useQueries,
} from "@tanstack/react-query"

import {
  rolesService,
} from "@/features/roles/services/roles.service"

import type {
  User,
} from "../types/user.types"

// Un usuario puede tener varios roles (m2m) -- el "piso" de
// permisos que ya tiene sin ningún override es la UNIÓN de los
// permisos de todos sus roles. Se pide 1 query por rol (comparten
// caché con la pantalla de Roles vía la misma queryKey) y se
// combinan acá.
export function useUserBasePermissions(
  user:User | null,
){

  const roleIds=
    user?.roles.map(role=>role.id) ?? []

  const results=
    useQueries({

      queries:
        roleIds.map(roleId=>({

          queryKey:["roles",roleId,"permissions"],

          queryFn:
            ()=>rolesService.getRolePermissions(roleId),

          enabled:!!user,

        })),

    })

  const loading=
    results.some(result=>result.isLoading)

  const basePermissionIds=new Set<string>()

  for(const result of results){

    for(const permission of result.data??[]){
      basePermissionIds.add(permission.id)
    }

  }

  return{

    basePermissionIds,

    loading,

  }

}
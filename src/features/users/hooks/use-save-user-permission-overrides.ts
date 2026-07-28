"use client"

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  usersService,
} from "../services/users.service"

import type {
  UserPermissionOverride,
} from "../types/permission-override.types"

type SaveArgs = {

  // Estado final deseado -- todos los permisos que deberían quedar
  // tildados para este usuario, mezclando lo que le da su rol y sus
  // excepciones puntuales.
  checkedIds:Set<string>

  // "Piso" que ya le dan sus roles, sin overrides.
  basePermissionIds:Set<string>

  // Overrides que ya existen en el backend, para no recrear los que
  // no cambiaron y borrar los que ya sobran.
  existingOverrides:UserPermissionOverride[]

}

export function useSaveUserPermissionOverrides(
  userId:string | null,
){

  const queryClient=useQueryClient()

  const mutation=
    useMutation({

      mutationFn:
        async({checkedIds,basePermissionIds,existingOverrides}:SaveArgs)=>{

          if(!userId) return

          const overrideByPermissionId=
            new Map(
              existingOverrides.map(
                override=>[override.permission.id,override]
              )
            )

          const allPermissionIds=
            new Set([
              ...checkedIds,
              ...basePermissionIds,
              ...overrideByPermissionId.keys(),
            ])

          const jobs:Promise<unknown>[]=[]

          for(const permissionId of allPermissionIds){

            const desired=
              checkedIds.has(permissionId)

            const base=
              basePermissionIds.has(permissionId)

            const existing=
              overrideByPermissionId.get(permissionId)

            // Coincide con lo que ya le da el rol -- si había una
            // excepción de por medio, ya no hace falta, se borra.
            if(desired===base){

              if(existing){
                jobs.push(
                  usersService.removePermissionOverride(userId,existing.id)
                )
              }

              continue

            }

            // No coincide con el rol -- hace falta una excepción.
            // Si ya existe una con el efecto correcto, no se toca.
            const neededEffect=
              desired ? "ALLOW" : "DENY"

            if(existing?.effect===neededEffect){
              continue
            }

            jobs.push(
              usersService.setPermissionOverride(userId,{
                permissionId,
                effect:neededEffect,
              })
            )

          }

          await Promise.all(jobs)

        },

      onSuccess:()=>{

        queryClient.invalidateQueries({
          queryKey:["users",userId,"permission-overrides"],
        })

      },

    })

  return{

    save:mutation.mutateAsync,

    saving:mutation.isPending,

  }

}
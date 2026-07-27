import type{
  User,
}from"@/features/users/types/user.types"

import{
  getQueryClient,
}from"@/lib/query-client"

import{
  cacheAddEntity,
  cacheReplaceEntity,
  cacheRemoveEntity,
}from"@/shared/core/entity/cache/entity-cache"

import{
  authService,
}from"@/features/auth/services/auth.service"

import{
  useAuthStore,
}from"@/features/auth/store/auth-store"

import{
  usePermissionStore,
}from"@/features/permissions/store/permission-store"

import type{
  RealtimeEvent,
}from"../types/realtime-event"

type PresencePayload={
  id:string
  online:boolean
}

function isPresenceOnlyPayload(
  payload:unknown,
):payload is PresencePayload{

  if(
    !payload ||
    typeof payload!=="object"
  ){
    return false
  }

  const keys=
    Object.keys(payload as object)

  return(
    keys.length===2 &&
    keys.includes("id") &&
    keys.includes("online")
  )

}

const USER_LIST_QUERY_KEYS=[
  ["users"],
  ["users","directory"],
] as const

export function userHandler(
  event:RealtimeEvent,
){

  const queryClient=
    getQueryClient()

  switch(event.action){

    case"CREATED":{

      cacheAddEntity<User>(

        queryClient,

        "users",

        "user",

        event.payload as User,

      )

      return

    }

    case"UPDATED":{

      if(isPresenceOnlyPayload(event.payload)){

        const{
          id,
          online,
        }=
          event.payload as PresencePayload

        for(const queryKey of USER_LIST_QUERY_KEYS){

          queryClient.setQueryData<User[]>(

            queryKey as unknown as string[],

            current=>

              current?.map(user=>

                user.id===id

                  ?{
                      ...user,
                      online,
                    }

                  :user,

              ),

          )

        }

        queryClient.setQueryData<User>(

          [
            "user",
            id,
          ],

          current=>

            current

              ?{
                  ...current,
                  online,
                }

              :current,

        )

        return

      }

      cacheReplaceEntity<User>(

        queryClient,

        "users",

        "user",

        event.payload as User,

      )

      // El payload trae al usuario ya actualizado (nuevos roleIds,
      // active, etc). Si el usuario editado es UNO MISMO, hay que
      // reemitir el JWT: el backend arma request.user.permissions
      // desde lo firmado en el token, no contra la base de datos en
      // cada request. Antes esto solo actualizaba la caché de React
      // Query (útil para la tabla de usuarios en pantalla), pero
      // nunca tocaba la propia sesión — si un admin te reasignaba a
      // otro rol (en vez de editar los permisos del rol que ya
      // tenías), tu token seguía firmado con los permisos viejos
      // hasta que cerraras sesión manualmente, y seguías viendo
      // "Insufficient permissions" pese a ya tener el permiso nuevo.
      const updatedUser=
        event.payload as User

      const currentUser=
        useAuthStore.getState().user

      if(
        currentUser &&
        updatedUser.id===currentUser.id
      ){

        authService.refresh()
          .then(({ user, permissions })=>{

            useAuthStore.getState().setUser(user)
            usePermissionStore.getState().setPermissions(permissions)

          })
          .catch(()=>{
            // no crítico: la próxima navegación ya dispara sus
            // propios chequeos contra el backend si hiciera falta.
          })

      }

      return

    }

    case"DELETED":{

      cacheRemoveEntity<User>(

        queryClient,

        "users",

        "user",

        event.id,

      )

      return

    }

  }
}
"use client"

import {
  useQuery,
} from "@tanstack/react-query"

import {
  usersService,
} from "../services/users.service"

export function useUserPermissionOverrides(
  userId:string | null,
){

  const{
    data,
    isLoading,
  }=
    useQuery({

      queryKey:["users",userId,"permission-overrides"],

      queryFn:
        ({signal})=>usersService.getPermissionOverrides(userId as string,signal),

      enabled:!!userId,

    })

  return{

    overrides:
      data??[],

    loading:
      isLoading,

  }

}
"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ReactNode,
} from "react"

import {
  authSession,
} from "@/lib/auth-session"

import {
  authService,
} from "@/features/auth/services/auth.service"

import {
  useAuthStore,
} from "@/features/auth/store/auth-store"

import {
  usePermissionStore,
} from "@/features/permissions/store/permission-store"

import {
  AppShell,
} from "@/shared/responsive/layout/app-shell"

import {
  AppLoadingScreen,
} from "@/shared/ui/loading/app-loading-screen"

import {
  taskService,
} from "@/features/tasks/services/task.service"

import {
  projectService,
} from "@/features/projects/services/project.service"

export function ProtectedLayoutClient({
  children,
}:{
  children:ReactNode
}){

  const router=
    useRouter()

  const queryClient=
    useQueryClient()

  const setUser=
    useAuthStore(
      state=>state.setUser,
    )

  const setPermissions=
    usePermissionStore(
      state=>state.setPermissions,
    )

  const[
    bootstrapDone,
    setBootstrapDone,
  ]=
    useState(false)

  const[
    showLoading,
    setShowLoading,
  ]=
    useState(true)

  useEffect(()=>{

    async function bootstrap(){

      const token=
        authSession.get()

      if(!token){

        router.replace(
          "/login",
        )

        return

      }

      try{

        const {
          user,
          permissions,
          accessToken,
        } = await authService.me()

        // Persistir token fresco: PermissionsGuard usa JWT, no el Set.
        if (accessToken) {
          authSession.set(accessToken)
        }

        setUser(user)
        setPermissions(permissions)

        setBootstrapDone(
          true,
        )

        // Precarga en paralelo, sin esperar — el splash "ETM" ya
        // se está mostrando de todos modos mientras se confirma la
        // sesión; aprovechamos ESE momento para que el caché de
        // Tasks/Projects ya esté tibio cuando el usuario haga el
        // primer click, en vez de arrancar en frío recién ahí.
        // prefetchQuery no bloquea nada: si el usuario ya está en
        // otra pantalla cuando termina, no hace nada malo (React
        // Query lo descarta si nadie lo usa antes de que expire).
        queryClient.prefetchQuery({
          queryKey:["tasks"],
          queryFn:({ signal })=>taskService.findAll(signal),
        })

        queryClient.prefetchQuery({
          queryKey:["projects"],
          queryFn:({ signal })=>projectService.findAll(signal),
        })

      }catch{

        authSession.set(
          null,
        )

        router.replace(
          "/login",
        )

      }

    }

    bootstrap()

  },[
    router,
    setUser,
    setPermissions,
    queryClient,
  ])

  if(showLoading){

    return(
      <AppLoadingScreen
        isReady={bootstrapDone}
        onComplete={()=>setShowLoading(false)}
      />
    )

  }

  return(

    <AppShell>

      {children}

    </AppShell>

  )

}
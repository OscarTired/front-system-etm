"use client"

import { useQuery } from "@tanstack/react-query"

import { sidebarService } from "../services/sidebar.service"

const EMPTY_PROCESS_COUNTS={
  CT:0,
  PL:0,
  SD:0,
  PT:0,
  EN:0,
  DS:0,
}

export type ProcessCounts=typeof EMPTY_PROCESS_COUNTS

export const sidebarCountsQueryKey=["sidebar-counts"] as const

// Antes: useProjects()+useTasks() acá adentro — traía la lista
// COMPLETA de proyectos y tareas (con TODOS sus includes pesados:
// cliente, etapa, estado, pm, workflowSteps, prioridad, material,
// espesor, color...) solo para contarlos del lado del cliente. Como
// el sidebar está SIEMPRE montado, eso se disparaba en cada página
// de la app, aunque el usuario esté mirando Producción o Usuarios,
// donde esos datos ni se usan.
//
// Ahora pega a un endpoint liviano (/sidebar/counts) que ya devuelve
// los 3 números calculados del lado del servidor con queries de
// agregación (COUNT/GROUP BY) — nada de relaciones anidadas. Se
// mantiene al día vía invalidación desde los mismos realtime
// handlers que ya tocan proyectos/tareas/workflow (ver
// project-handler.ts, task-handler.ts, workflow-handler.ts).
export function useSidebarCounts(){

  const { data }=useQuery({
    queryKey:sidebarCountsQueryKey,
    queryFn:({ signal })=>sidebarService.getCounts(signal),
    staleTime:1000*15,
  })

  return{
    projectsCount:data?.projectsCount??0,
    activeTasksCount:data?.activeTasksCount??0,
    processCounts:data?.processCounts??EMPTY_PROCESS_COUNTS,
  }

}
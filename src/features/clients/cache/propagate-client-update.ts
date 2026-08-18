import type { QueryClient } from "@tanstack/react-query"

import type { Client } from "../types/client.types"
import type { Project } from "@/features/projects/types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

/**
 * Tras editar un cliente, el listado `clients` ya tiene el dato nuevo,
 * pero proyectos/tareas guardan `client` anidado. Sin esto la UI
 * (badge, fila, chip) sigue mostrando el snapshot viejo hasta un refetch.
 */
export function propagateClientUpdate(
  queryClient: QueryClient,
  client: Client,
) {
  queryClient.setQueryData<Client>(["client", client.id], client)

  queryClient.setQueryData<Project[]>(["projects"], current =>
    (current ?? []).map(project =>
      project.client?.id === client.id
        ? { ...project, client }
        : project,
    ),
  )

  // Caches individuales de proyecto
  const projectQueries = queryClient.getQueriesData<Project>({
    queryKey: ["project"],
  })
  for (const [key, project] of projectQueries) {
    if (project?.client?.id === client.id) {
      queryClient.setQueryData<Project>(key, { ...project, client })
    }
  }

  queryClient.setQueryData<Task[]>(["tasks"], current =>
    (current ?? []).map(task => {
      if (task.project?.client?.id !== client.id) return task
      return {
        ...task,
        project: {
          ...task.project,
          client,
        },
      }
    }),
  )
}

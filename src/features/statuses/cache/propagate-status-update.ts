import type { QueryClient } from "@tanstack/react-query"

import type { Status } from "../types/status.types"
import type { Project } from "@/features/projects/types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

/**
 * Status anidado en projects[] y tasks[].
 */
export function propagateStatusUpdate(
  queryClient: QueryClient,
  status: Status,
) {
  queryClient.setQueryData<Status>(["status", status.id], status)

  queryClient.setQueryData<Project[]>(["projects"], current =>
    (current ?? []).map(project =>
      project.status?.id === status.id
        ? { ...project, status }
        : project,
    ),
  )

  for (const [key, project] of queryClient.getQueriesData<Project>({
    queryKey: ["project"],
  })) {
    if (project?.status?.id === status.id) {
      queryClient.setQueryData<Project>(key, { ...project, status })
    }
  }

  queryClient.setQueryData<Task[]>(["tasks"], current =>
    (current ?? []).map(task =>
      task.status?.id === status.id ? { ...task, status } : task,
    ),
  )
}

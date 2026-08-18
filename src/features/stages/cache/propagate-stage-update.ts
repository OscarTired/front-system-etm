import type { QueryClient } from "@tanstack/react-query"

import type { Stage } from "../types/stage.types"
import type { Project } from "@/features/projects/types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

/**
 * Stage vive en project.stage y en task.project.stage (no en Task raíz).
 */
export function propagateStageUpdate(
  queryClient: QueryClient,
  stage: Stage,
) {
  queryClient.setQueryData<Stage>(["stage", stage.id], stage)

  queryClient.setQueryData<Project[]>(["projects"], current =>
    (current ?? []).map(project =>
      project.stage?.id === stage.id
        ? { ...project, stage }
        : project,
    ),
  )

  for (const [key, project] of queryClient.getQueriesData<Project>({
    queryKey: ["project"],
  })) {
    if (project?.stage?.id === stage.id) {
      queryClient.setQueryData<Project>(key, { ...project, stage })
    }
  }

  queryClient.setQueryData<Task[]>(["tasks"], current =>
    (current ?? []).map(task => {
      if (task.project?.stage?.id !== stage.id) return task
      return {
        ...task,
        project: {
          ...task.project,
          stage,
        },
      }
    }),
  )
}

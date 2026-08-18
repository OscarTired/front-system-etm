import type { QueryClient } from "@tanstack/react-query"

import type { Priority } from "../types/priority.types"
import type { Task } from "@/features/tasks/types/task.types"

/**
 * Priority anidado solo en tasks[].
 */
export function propagatePriorityUpdate(
  queryClient: QueryClient,
  priority: Priority,
) {
  queryClient.setQueryData<Priority>(["priority", priority.id], priority)

  queryClient.setQueryData<Task[]>(["tasks"], current =>
    (current ?? []).map(task =>
      task.priority?.id === priority.id
        ? { ...task, priority }
        : task,
    ),
  )
}

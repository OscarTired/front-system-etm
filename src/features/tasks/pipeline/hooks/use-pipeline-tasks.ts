"use client"

import { useMemo } from "react"

import type { Task } from "@/features/tasks/types/task.types"

import { useTaskSearch } from "@/features/tasks/hooks/use-task-search"

import { useFilterStore } from "@/shared/filter/store/filter-store"
import { filterTasks } from "@/shared/filter/selectors/filter-tasks"

import { useSortStore } from "@/shared/sorting/store/sort-store"
import { createTaskView } from "@/shared/sorting/engine/sort-engine"

import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

type Params = {
  tasks: Task[]
  search: string
  showHistory: boolean
}

type PipelineTasksResult = {
  boardTasks: Task[]
  kpiTasks: Task[]
}

export function usePipelineTasks({
  tasks,
  search,
  showHistory,
}: Params): PipelineTasksResult {

  const searched = useTaskSearch(tasks, search)

  const filters = useFilterStore(
    s => s.filters.tasks,
  )

  const visible = useMemo(
    () => filterTasks({
      tasks: searched,
      filters,
    }),
    [searched, filters],
  )

  const taskSortMode = useSortStore(
    s => s.taskSortMode,
  )
  const taskSortDirection = useSortStore(
    s => s.taskSortDirection,
  )

  const sorted = useMemo(
    () => createTaskView({
      base: visible,
      mode: taskSortMode,
      direction: taskSortDirection,
    }),
    [visible, taskSortMode, taskSortDirection],
  )

  const boardTasks = useMemo(() => {

    if (showHistory) {

      const completed = sorted.filter(
        task => isWorkflowCompleted(task.workflowSteps),
      )

      const active = sorted.filter(
        task => !isWorkflowCompleted(task.workflowSteps),
      )

      return [...completed, ...active]

    }

    return sorted.filter(
      task => !isWorkflowCompleted(task.workflowSteps),
    )

  }, [sorted, showHistory])

  return {
    boardTasks,
    kpiTasks: sorted,
  }

}
"use client"

import { useQuery } from "@tanstack/react-query"
import {
  engineeringTaskService,
  type EngineeringTaskFilters,
} from "../services/engineering-task.service"

export function useEngineeringTasks(filters: EngineeringTaskFilters = {}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["engineering-tasks", filters],
    queryFn: ({ signal }) => engineeringTaskService.getAll(filters, signal),
  })

  return {
    tasks: data ?? [],
    loading: isLoading,
    refetch,
  }
}

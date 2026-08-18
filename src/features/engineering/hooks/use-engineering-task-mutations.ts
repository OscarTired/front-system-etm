"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { sidebarCountsQueryKey } from "@/shared/responsive/layout/hooks/use-sidebar-counts"

import {
  engineeringTaskService,
} from "../services/engineering-task.service"
import type {
  CreateEngineeringTaskDto,
  UpdateEngineeringTaskDto,
} from "../types/engineering-task.types"

export function useEngineeringTaskMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["engineering-tasks"] })
    void queryClient.invalidateQueries({ queryKey: sidebarCountsQueryKey })
  }

  const create = useMutation({
    mutationFn: (dto: CreateEngineeringTaskDto) =>
      engineeringTaskService.create(dto),
    onSuccess: () => {
      void invalidate()
      toast.success("Tarea de ingeniería creada")
    },
  })

  const update = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string
      dto: UpdateEngineeringTaskDto
    }) => engineeringTaskService.update(id, dto),
    onSuccess: () => {
      void invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => engineeringTaskService.remove(id),
    onSuccess: () => {
      void invalidate()
      toast.success("Tarea eliminada")
    },
  })

  return { create, update, remove }
}

import { api } from "@/lib/api"
import type {
  CreateEngineeringTaskDto,
  EngineeringTask,
  UpdateEngineeringTaskDto,
} from "../types/engineering-task.types"

export type EngineeringTaskFilters = {
  projectId?: string
  processCode?: string
  assigneeId?: string
}

export const engineeringTaskService = {
  async getAll(
    filters: EngineeringTaskFilters = {},
    signal?: AbortSignal,
  ): Promise<EngineeringTask[]> {
    const res = await api.get<EngineeringTask[]>("/engineering-tasks", {
      params: filters,
      signal,
    })
    return res.data
  },

  async create(
    dto: CreateEngineeringTaskDto,
  ): Promise<EngineeringTask> {
    const res = await api.post<EngineeringTask>("/engineering-tasks", dto)
    return res.data
  },

  async update(
    id: string,
    dto: UpdateEngineeringTaskDto,
  ): Promise<EngineeringTask> {
    const res = await api.patch<EngineeringTask>(
      `/engineering-tasks/${id}`,
      dto,
    )
    return res.data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/engineering-tasks/${id}`)
  },
}

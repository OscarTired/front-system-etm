import { api } from "@/lib/api"

import type {
  ActivityDepartment,
  ActivityLog,
  ActivityType,
  CreateActivityLogDto,
  CreateActivityTypeDto,
  UpdateActivityTypeDto,
} from "../types/activity-log.types"

export const activityLogService = {

  async getTypes(includeInactive = false, department?: ActivityDepartment, signal?: AbortSignal) {
    const response = await api.get<ActivityType[]>("/activity-types", {
      signal,
      params: {
        ...(includeInactive ? { includeInactive: "1" } : {}),
        ...(department ? { department } : {}),
      },
    })
    return response.data
  },

  async createType(dto: CreateActivityTypeDto) {
    const response = await api.post<ActivityType>("/activity-types", dto)
    return response.data
  },

  async updateType(id: string, dto: UpdateActivityTypeDto) {
    const response = await api.patch<ActivityType>(`/activity-types/${id}`, dto)
    return response.data
  },

  async removeType(id: string) {
    await api.delete(`/activity-types/${id}`)
  },

  async create(dto: CreateActivityLogDto) {
    const response = await api.post<ActivityLog>("/activity-log", dto)
    return response.data
  },

  async remove(id: string) {
    await api.delete(`/activity-log/${id}`)
  },

  async getMyToday(department?: ActivityDepartment, signal?: AbortSignal) {
    const response = await api.get<ActivityLog[]>("/activity-log/me/today", {
      signal,
      params: department ? { department } : undefined,
    })
    return response.data
  },

  async getAll(
    filters: { userId?: string; projectId?: string; taskId?: string; from?: string; to?: string; department?: ActivityDepartment },
    signal?: AbortSignal,
  ) {
    const response = await api.get<ActivityLog[]>("/activity-log", { params: filters, signal })
    return response.data
  },

}
import { api } from "@/lib/api"

import type {
  ActivityDepartment,
  ActivityLog,
  ActivityType,
  CreateActivityLogDto,
  CreateActivityTypeDto,
  DayShift,
  UpdateActivityLogDto,
  UpdateActivityTypeDto,
} from "../types/activity-log.types"
import type { ShiftSchedule } from "../types/shift-schedule.types"

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

  async updateShift(id: string, shift: DayShift) {
    const response = await api.patch<ActivityLog>(`/activity-log/${id}`, { shift })
    return response.data
  },

  async update(id: string, dto: UpdateActivityLogDto) {
    const response = await api.patch<ActivityLog>(`/activity-log/${id}`, dto)
    return response.data
  },

  async getMyToday(department?: ActivityDepartment, date?: string, signal?: AbortSignal) {
    const response = await api.get<ActivityLog[]>("/activity-log/me/today", {
      signal,
      params: {
        ...(department ? { department } : {}),
        ...(date ? { date } : {}),
      },
    })
    return response.data
  },

  /**
   * Rango del usuario autenticado (agenda / mes).
   * Backend fija userId desde el JWT — no se manda userId.
   * Solo ACTIVITY_LOG_READ.
   */
  async getMyRange(
    params: { from: string; to: string; department?: ActivityDepartment },
    signal?: AbortSignal,
  ) {
    const response = await api.get<ActivityLog[]>("/activity-log/me", {
      signal,
      params,
    })
    return response.data
  },

  async getMyMarkedDates(
    params: { from: string; to: string; department?: ActivityDepartment },
    signal?: AbortSignal,
  ) {
    const response = await api.get<string[]>("/activity-log/me/marked-dates", {
      signal,
      params,
    })
    return response.data
  },

  async getMarkedDates(
    params: {
      from: string
      to: string
      userId?: string
      department?: ActivityDepartment
    },
    signal?: AbortSignal,
  ) {
    const response = await api.get<string[]>("/activity-log/marked-dates", {
      signal,
      params,
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

  async getShiftSchedule(date?: string, signal?: AbortSignal) {
    const response = await api.get<ShiftSchedule>("/activity-log/shifts", {
      signal,
      params: date ? { date } : undefined,
    })
    return response.data
  },

}
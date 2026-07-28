import type {
  User,
} from "../types/user.types"

import type {
  UserForm,
} from "../types/user-form.types"

import type {
  CreateUserPermissionOverrideInput,
  UserPermissionOverride,
} from "../types/permission-override.types"

import {
  api,
} from "@/lib/api"

export const usersService = {

  async directory(signal?:AbortSignal): Promise<User[]> {

    const response =
      await api.get<User[]>(
        "/users/directory",
        { signal },
      )

    return response.data

  },

  async findAll(signal?:AbortSignal): Promise<User[]> {

    const response =
      await api.get<User[]>(
        "/users",
        { signal },
      )

    return response.data

  },

  async create(
    data: UserForm,
  ): Promise<User> {

    const response =
      await api.post<User>(
        "/users",
        data,
      )

    return response.data

  },

  async update(
    id: string,
    data: Partial<UserForm>,
  ): Promise<User> {

    const response =
      await api.patch<User>(
        `/users/${id}`,
        data,
      )

    return response.data

  },

  async remove(
    id: string,
  ): Promise<void> {

    await api.delete(
      `/users/${id}`,
    )

  },

  // ---- Excepciones de permisos por usuario (overrides) ----

  async getPermissionOverrides(
    userId: string,
    signal?: AbortSignal,
  ): Promise<UserPermissionOverride[]> {

    const response =
      await api.get<UserPermissionOverride[]>(
        `/users/${userId}/permission-overrides`,
        { signal },
      )

    return response.data

  },

  // El backend hace upsert por [userId, permissionId] -- llamar esto
  // de nuevo para un permiso que ya tiene override simplemente lo
  // reemplaza (ej. pasar de DENY a ALLOW), no acumula filas.
  async setPermissionOverride(
    userId: string,
    data: CreateUserPermissionOverrideInput,
  ): Promise<UserPermissionOverride> {

    const response =
      await api.post<UserPermissionOverride>(
        `/users/${userId}/permission-overrides`,
        data,
      )

    return response.data

  },

  async removePermissionOverride(
    userId: string,
    overrideId: string,
  ): Promise<void> {

    await api.delete(
      `/users/${userId}/permission-overrides/${overrideId}`,
    )

  },

}
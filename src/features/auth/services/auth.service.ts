import {
  api,
} from "@/lib/api"

import {
  authSession,
} from "@/lib/auth-session"

import type {
  User,
} from "@/features/users/types/user.types"

export interface LoginResponse{

  accessToken:string

  user:User

  permissions:string[]

}

export interface MeResponse{

  /** Token reemitido con permisos actuales (paridad con login/refresh). */
  accessToken:string

  user:User

  permissions:string[]

}

export const authService={

  async login(
    email:string,
    password:string,
  ):Promise<LoginResponse>{

    const res=
      await api.post<LoginResponse>(
        "/auth/login",
        {
          email,
          password,
        },
      )

    authSession.set(
      res.data.accessToken,
    )

    return res.data

  },

  async me():Promise<MeResponse>{

    const res=
      await api.get<MeResponse>(
        "/auth/me",
      )

    return res.data

  },

  // Reemite el accessToken con los permisos actuales del rol (ver
  // rolePermissionsHandler). Guarda el token nuevo en authSession
  // antes de devolver la respuesta, igual que hace login().
  async refresh():Promise<LoginResponse>{

    const res=
      await api.post<LoginResponse>(
        "/auth/refresh",
      )

    authSession.set(
      res.data.accessToken,
    )

    return res.data

  },

}
"use client"

import { usePermissionStore } from "../store/permission-store"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"

/**
 * Permisos efectivos = Set hidratado desde /auth/me | login | refresh.
 * Sin bypass por rol: ADMIN obtiene todos los códigos vía seed + JWT.
 */
export function usePermissions() {
  const permissions = usePermissionStore(state => state.permissions)

  return {
    has: (permission: PermissionCode) => permissions.has(permission),

    hasAny: (...codes: PermissionCode[]) =>
      codes.some(permission => permissions.has(permission)),

    hasAll: (...codes: PermissionCode[]) =>
      codes.every(permission => permissions.has(permission)),
  }
}

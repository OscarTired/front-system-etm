"use client"

import { usePermissionStore } from "../store/permission-store"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { useAuthStore } from "@/features/auth/store/auth-store"

/**
 * Lectura de permisos efectivos.
 * ADMIN (rol code) → acceso total, sin depender de que el Set
 * traiga cada código (evita “todo marcado en UI pero JWT viejo”).
 */
export function usePermissions() {
  const permissions = usePermissionStore(state => state.permissions)
  const roles = useAuthStore(s => s.user?.roles)

  const isAdmin =
    roles?.some(r => r.code === "ADMIN") === true

  const has = (permission: PermissionCode) => {
    if (isAdmin) return true
    return permissions.has(permission)
  }

  return {
    has,
    hasAny: (...codes: PermissionCode[]) =>
      isAdmin || codes.some(p => permissions.has(p)),
    hasAll: (...codes: PermissionCode[]) =>
      isAdmin || codes.every(p => permissions.has(p)),
    isAdmin,
  }
}

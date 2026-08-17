import type { User } from "@/features/users/types/user.types"
import {
  ENGINEERING_ASSIGNABLE_ROLE_CODES,
  userHasRoleCode,
} from "@/shared/core/constants/department-roles"

/** Activo + rol INGENIERIA o PROYECTOS (misma lista que bitácora). */
export function isEngineeringUser(
  user: Pick<User, "active" | "deletedAt" | "roles">,
): boolean {
  if (!user.active) return false
  if (user.deletedAt) return false
  return userHasRoleCode(user.roles, ENGINEERING_ASSIGNABLE_ROLE_CODES)
}

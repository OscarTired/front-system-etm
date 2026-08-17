import type { UserRole } from "../types/user.types"
import {
  LEVELS_BY_ROLE_CODE,
  type JobLevelCode,
} from "@/shared/core/constants/department-roles"
import { RoleCode } from "@/shared/core/enums/role-code.enum"

export type Level = JobLevelCode

export function getAllowedLevelsForRoles(
  roles: Pick<UserRole, "code">[],
): Level[] {
  return Array.from(
    new Set(
      roles.flatMap(role => {
        const code = role.code as RoleCode
        return LEVELS_BY_ROLE_CODE[code] ?? []
      }),
    ),
  )
}

export function isLevelAllowedForRoles(
  level: "GENERAL" | Level | null | undefined,
  roles: Pick<UserRole, "code">[],
): boolean {
  if (!level || level === "GENERAL") {
    return true
  }
  return getAllowedLevelsForRoles(roles).includes(level)
}
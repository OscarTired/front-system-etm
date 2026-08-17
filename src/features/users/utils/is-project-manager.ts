import type { User } from "../types/user.types"
import {
  PROJECT_MANAGER_ROLE_CODES,
  userHasRoleCode,
} from "@/shared/core/constants/department-roles"

export function isProjectManager(
  user: Pick<User, "roles" | "level">,
): boolean {
  return (
    userHasRoleCode(user.roles, PROJECT_MANAGER_ROLE_CODES) &&
    user.level === "SUPERVISOR"
  )
}
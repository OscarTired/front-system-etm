import { RoleCode } from "@/shared/core/enums/role-code.enum"

export type JobLevelCode = "OPERARIO" | "SUPERVISOR"

/** Espejo backend BITACORA_DEPARTMENT_ROLES */
export const BITACORA_DEPARTMENT_ROLE_CODES = {
  PRODUCCION: [RoleCode.PRODUCCION],
  INGENIERIA: [RoleCode.INGENIERIA, RoleCode.PROYECTOS],
} as const satisfies Record<string, readonly RoleCode[]>

export const PROJECT_MANAGER_ROLE_CODES = [
  RoleCode.INGENIERIA,
  RoleCode.PROYECTOS,
] as const satisfies readonly RoleCode[]

/** Misma fuente que bitácora de ingeniería (INGENIERIA + PROYECTOS). */
export const ENGINEERING_ASSIGNABLE_ROLE_CODES =
  BITACORA_DEPARTMENT_ROLE_CODES.INGENIERIA

export const PRODUCTION_OPERATOR_ROLE_CODE = RoleCode.PRODUCCION

/** Espejo backend UsersService.LEVELS_BY_ROLE */
export const LEVELS_BY_ROLE_CODE: Partial<Record<RoleCode, JobLevelCode[]>> = {
  [RoleCode.PRODUCCION]: ["OPERARIO", "SUPERVISOR"],
  [RoleCode.INGENIERIA]: ["SUPERVISOR"],
  [RoleCode.PROYECTOS]: ["SUPERVISOR"],
}

export function roleCodesInclude(
  userRoleCodes: readonly string[],
  allowed: readonly RoleCode[],
): boolean {
  return userRoleCodes.some(code =>
    (allowed as readonly string[]).includes(code),
  )
}

export function userHasRoleCode(
  roles: readonly { code: string }[] | null | undefined,
  allowed: readonly RoleCode[],
): boolean {
  if (!roles?.length) return false
  return roleCodesInclude(
    roles.map(r => r.code),
    allowed,
  )
}

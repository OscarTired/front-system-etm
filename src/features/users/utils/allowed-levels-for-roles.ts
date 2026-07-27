import type { UserRole } from "../types/user.types"

export type Level = "OPERARIO" | "SUPERVISOR"

// Mismo criterio que el backend (assertLevelMatchesRole): PRODUCCION
// admite OPERARIO/SUPERVISOR, Ingeniería y Proyectos admiten solo
// SUPERVISOR, el resto no admite sub-nivel. Antes esta lógica vivía
// duplicada (completa en un lugar, incompleta en otro) — este es el
// único lugar a tocar si mañana se suma un departamento más.
const LEVELS_BY_ROLE_CODE: Record<string, Level[]> = {
  PRODUCCION: ["OPERARIO", "SUPERVISOR"],
  INGENIERIA: ["SUPERVISOR"],
  PROYECTOS: ["SUPERVISOR"],
}

// Con varios roles a la vez, el nivel es válido si CUALQUIERA de los
// roles elegidos lo permite (unión, no intersección) — así alguien
// Producción + Ingeniería puede seguir siendo Operario, que
// Ingeniería sola no permitiría.
export function getAllowedLevelsForRoles(
  roles: Pick<UserRole, "code">[],
): Level[] {
  return Array.from(
    new Set(
      roles.flatMap(
        role => LEVELS_BY_ROLE_CODE[role.code] ?? [],
      ),
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
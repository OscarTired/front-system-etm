import type { User } from "../types/user.types"

// Departamentos que hoy pueden aportar Project Managers. Antes esto
// era "todo el que sea del departamento PROYECTOS" (sin mirar
// nivel), lo que traía a TODOS los usuarios de Proyectos —
// operarios/generales incluidos — como candidatos a PM, e ignoraba
// por completo a Ingeniería. El criterio real es "supervisor dentro
// de Ingeniería o Proyectos": si mañana se suma un tercer
// departamento con supervisores que también puedan ser PM, este es
// el único lugar a tocar.
const PM_DEPARTMENTS = [
  "INGENIERIA",
  "PROYECTOS",
] as const

export function isProjectManager(
  user: Pick<User, "role" | "level">,
): boolean {
  return (
    PM_DEPARTMENTS.includes(
      user.role?.code as typeof PM_DEPARTMENTS[number],
    )
    && user.level === "SUPERVISOR"
  )
}
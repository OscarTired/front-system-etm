import type { User } from "@/features/users/types/user.types"

/** Usuarios de ingeniería: rol code contiene ING, o sin roles de planta puros. */
export function isEngineeringUser(user: User): boolean {
  if (!user.active) return false
  if (user.deletedAt) return false
  const roles = user.roles ?? []
  if (roles.length === 0) return true
  return roles.some(r => {
    const c = (r.code ?? "").toUpperCase()
    const n = (r.name ?? "").toUpperCase()
    return (
      c.includes("ING") ||
      n.includes("INGENIER") ||
      c === "ADMIN" ||
      c.includes("ADMIN")
    )
  })
}

import type { EntityIcon } from "@/shared/constants/entity-icons"
import type { User } from "@/features/users/types/user.types"
import type {
  ActivityLog,
  ActivityLogUserRef,
  DayShift,
} from "../types/activity-log.types"
import type {
  ComplianceStatus,
  TeamSupervisionResult,
  TeamUserCompliance,
} from "../types/team-supervision.types"
import { getCurrentShift } from "../constants/shift-definitions"

function effectiveShift(log: ActivityLog): DayShift | null {
  if (log.shift) return log.shift
  try {
    return getCurrentShift(new Date(log.loggedAt))
  } catch {
    return null
  }
}

function resolveStatus(
  manual: number,
  auto: number,
  total: number,
): ComplianceStatus {
  if (total === 0) return "missing"
  if (manual === 0 && auto > 0) return "partial"
  return "ok"
}

const STATUS_RANK: Record<ComplianceStatus, number> = {
  missing: 0,
  partial: 1,
  ok: 2,
}

/** Stub mínimo desde el user embebido en el log (getAll). */
function userFromLogRef(ref: ActivityLogUserRef): User {
  return {
    id: ref.id,
    name: ref.name,
    color: ref.color ?? "#71717A",
    icon: (ref.icon as EntityIcon) ?? "User",
    username: null,
    email: "",
    active: true,
    online: false,
    lastSeenAt: null,
    avatarUrl: null,
    phone: null,
    position: null,
    deletedAt: null,
    createdAt: "",
    updatedAt: "",
    roles: [],
    level: null,
    areas: [],
  }
}

/**
 * Une directorio + usuarios inferidos de los logs.
 *
 * Importante: si `/users/directory` viene vacío o filtra de más,
 * igual aparecen quienes tienen entradas (log.user / userId).
 * Sin esto: 22 entradas + cobertura 0/0 + "Nadie en este filtro".
 */
export function buildTeamSupervision(
  users: User[],
  logs: ActivityLog[],
): TeamSupervisionResult {
  const byId = new Map<string, User>()

  for (const u of users) {
    // deletedAt nulo/undefined OK; active explícitamente false se excluye
    // del ranking de "debería llenar", pero si tiene logs se rehidrata abajo.
    if (u.deletedAt) continue
    if (u.active === false) continue
    byId.set(u.id, u)
  }

  const logsByUser = new Map<string, ActivityLog[]>()
  for (const log of logs) {
    const id = log.userId || log.user?.id
    if (!id) continue

    const list = logsByUser.get(id)
    if (list) list.push(log)
    else logsByUser.set(id, [log])

    if (!byId.has(id) && log.user) {
      byId.set(id, userFromLogRef(log.user))
    } else if (!byId.has(id)) {
      // Log sin user poblado: fila mínima para no perder la cobertura
      byId.set(id, userFromLogRef({
        id,
        name: "Usuario",
        color: "#71717A",
        icon: "User",
      }))
    }
  }

  const rows: TeamUserCompliance[] = [...byId.values()].map(user => {
    const userLogs = logsByUser.get(user.id) ?? []
    let manual = 0
    let auto = 0
    const shifts = new Set<DayShift>()
    let lastLoggedAt: string | null = null

    for (const log of userLogs) {
      if (log.source === "AUTO") auto += 1
      else manual += 1

      const shift = effectiveShift(log)
      if (shift) shifts.add(shift)

      if (
        !lastLoggedAt ||
        new Date(log.loggedAt).getTime() > new Date(lastLoggedAt).getTime()
      ) {
        lastLoggedAt = log.loggedAt
      }
    }

    const total = userLogs.length
    const status = resolveStatus(manual, auto, total)

    return {
      userId: user.id,
      user,
      status,
      total,
      manual,
      auto,
      lastLoggedAt,
      shiftsFilled: [...shifts],
      logs: userLogs,
    }
  })

  rows.sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    if (byStatus !== 0) return byStatus
    if (a.total !== b.total) return a.total - b.total
    return a.user.name.localeCompare(b.user.name, "es")
  })

  const missing = rows.filter(r => r.status === "missing").length
  const partial = rows.filter(r => r.status === "partial").length
  const ok = rows.filter(r => r.status === "ok").length
  const withLogs = rows.filter(r => r.total > 0).length
  const teamSize = rows.length
  const totalEntries = logs.length
  const manualEntries = logs.filter(l => l.source !== "AUTO").length
  const autoEntries = totalEntries - manualEntries

  return {
    kpis: {
      teamSize,
      withLogs,
      missing,
      partial,
      ok,
      coveragePct:
        teamSize === 0 ? 0 : Math.round((withLogs / teamSize) * 100),
      totalEntries,
      manualEntries,
      autoEntries,
    },
    rows,
  }
}

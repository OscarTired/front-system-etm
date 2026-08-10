import type { User } from "@/features/users/types/user.types"
import type { ActivityLog, DayShift } from "./activity-log.types"

export type ComplianceStatus = "ok" | "partial" | "missing"

export type TeamUserCompliance = {
  userId: string
  user: User
  status: ComplianceStatus
  total: number
  manual: number
  auto: number
  lastLoggedAt: string | null
  /** Franjas con al menos un log (efectivo) en el periodo */
  shiftsFilled: DayShift[]
  logs: ActivityLog[]
}

export type TeamSupervisionKpis = {
  teamSize: number
  withLogs: number
  missing: number
  partial: number
  ok: number
  /** 0–100 */
  coveragePct: number
  totalEntries: number
  manualEntries: number
  autoEntries: number
}

export type TeamSupervisionStatusFilter = "all" | ComplianceStatus

export type TeamSupervisionResult = {
  kpis: TeamSupervisionKpis
  rows: TeamUserCompliance[]
}

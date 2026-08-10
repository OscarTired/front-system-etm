import type { ActivityLog, DayShift } from "../types/activity-log.types"

/** Máximo de MANUAL idénticas por franja (tipo + proyecto + tarea). */
export const MAX_IDENTICAL_MANUAL_PER_SHIFT = 3

export function activityFingerprint(log: {
  activityTypeId?: string
  activityType?: { id: string }
  projectId?: string | null
  project?: { id: string } | null
  taskId?: string | null
  task?: { id: string } | null
  shift: DayShift | null
}) {
  const typeId = log.activityTypeId ?? log.activityType?.id ?? ""
  const projectId = log.projectId ?? log.project?.id ?? ""
  const taskId = log.taskId ?? log.task?.id ?? ""
  const shift = log.shift ?? ""
  return `${typeId}|${projectId}|${taskId}|${shift}`
}

export function countIdenticalInShift(
  logs: ActivityLog[],
  source: ActivityLog,
): number {
  const fp = activityFingerprint(source)
  return logs.filter(
    l =>
      l.source === "MANUAL" &&
      !l.id.startsWith("optimistic-") &&
      activityFingerprint(l) === fp,
  ).length
}

export function canDuplicateActivity(
  logs: ActivityLog[],
  source: ActivityLog,
  max = MAX_IDENTICAL_MANUAL_PER_SHIFT,
): boolean {
  if (source.source !== "MANUAL") return false
  if (source.id.startsWith("optimistic-")) return false
  return countIdenticalInShift(logs, source) < max
}
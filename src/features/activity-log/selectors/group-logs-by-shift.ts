import { SHIFT_GROUPS, getCurrentShift } from "../constants/shift-definitions"
import type { ActivityLog, DayShift } from "../types/activity-log.types"

/** AUTO no trae shift: se deriva de loggedAt solo para UI. */
export function getEffectiveShift(
  log: Pick<ActivityLog, "shift" | "loggedAt">,
): DayShift {
  return log.shift ?? getCurrentShift(new Date(log.loggedAt))
}

export function groupLogsByShift(logs: ActivityLog[]) {
  const buckets: {
    key: string
    label: string
    icon: (typeof SHIFT_GROUPS)[number]["icon"]
    logs: ActivityLog[]
  }[] = []

  for (const group of SHIFT_GROUPS) {
    const shiftsInGroup = new Set(group.slots.map(slot => slot.shift))

    const matched = logs.filter(log =>
      shiftsInGroup.has(getEffectiveShift(log)),
    )

    if (matched.length > 0) {
      buckets.push({
        key: group.key,
        label: group.label,
        icon: group.icon,
        logs: matched,
      })
    }
  }

  return buckets
}

/** dayISO (YYYY-MM-DD) → logs de ese día local */
export function filterLogsByDayISO(logs: ActivityLog[], dayISO: string) {
  return logs.filter(log => {
    const d = new Date(log.loggedAt)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}` === dayISO
  })
}

export function logsForDayAndShift(
  logs: ActivityLog[],
  dayISO: string,
  shift: DayShift,
) {
  return filterLogsByDayISO(logs, dayISO)
    .filter(log => getEffectiveShift(log) === shift)
    .sort(
      (a, b) =>
        new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
    )
}
"use client"

import { getActivityIcon } from "../constants/activity-icons"
import type { ActivityLog } from "../types/activity-log.types"
import { cn } from "@/shared/utils/utils"

type Props = {
  log: ActivityLog
  compact?: boolean
  onClick?: () => void
  className?: string
}

export function ActivityLogChip({
  log,
  compact = false,
  onClick,
  className,
}: Props) {
  const Icon = getActivityIcon(log.activityType.icon)
  const color = log.activityType.color

  return (
    <button
      type="button"
      onClick={onClick}
      title={log.activityType.label}
      className={cn(
        "flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-opacity hover:opacity-90",
        className,
      )}
      style={{
        backgroundColor: `${color}22`,
        color,
      }}
    >
      <Icon size={compact ? 11 : 12} className="shrink-0" strokeWidth={2.25} />
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {log.activityType.label}
      </span>
      {log.source === "AUTO" && (
        <span className="shrink-0 rounded bg-black/20 px-1 text-[9px] font-semibold uppercase opacity-80">
          Auto
        </span>
      )}
    </button>
  )
}
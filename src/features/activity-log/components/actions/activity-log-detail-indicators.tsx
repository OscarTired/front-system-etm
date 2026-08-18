"use client"

import { FileText, ImageIcon } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import type { ActivityLog } from "../../types/activity-log.types"

type Props = {
  log: ActivityLog
  className?: string
  /** Mobile/compact: iconos un poco más chicos. */
  compact?: boolean
}

/**
 * Señales de detalle/foto sin abrir el log.
 * Bitácora propia + supervisión.
 */
export function ActivityLogDetailIndicators({
  log,
  className,
  compact = false,
}: Props) {
  const hasNote = Boolean(log.note?.trim())
  const hasPhoto = Boolean(log.photoUrl)
  if (!hasNote && !hasPhoto) return null

  const size = compact ? 12 : 13
  const box = compact ? "size-6" : "size-7"

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1", className)}
      onClick={e => e.stopPropagation()}
    >
      {hasNote && (
        <span
          title="Con detalle"
          aria-label="Con detalle"
          className={cn(
            "flex items-center justify-center rounded-md bg-sky-500/15 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
            box,
          )}
        >
          <FileText size={size} strokeWidth={2.25} />
        </span>
      )}
      {hasPhoto && (
        <span
          title="Con foto"
          aria-label="Con foto"
          className={cn(
            "flex items-center justify-center rounded-md bg-violet-500/15 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
            box,
          )}
        >
          <ImageIcon size={size} strokeWidth={2.25} />
        </span>
      )}
    </span>
  )
}

"use client"

import { CheckCircle2, PlayCircle, Zap } from "lucide-react"

import { useBadgeColors } from "@/shared/utils/use-badge-colors"

import type { ActivityLog } from "../types/activity-log.types"

type Props = {
  logs: ActivityLog[]
}

type AutoKind = {
  icon: typeof CheckCircle2
  verb: string
}

const AUTO_KIND: Record<string, AutoKind> = {
  TASK_STARTED: { icon: PlayCircle, verb: "Inició" },
  TASK_COMPLETED: { icon: CheckCircle2, verb: "Completado" },
}

const DEFAULT_KIND: AutoKind = { icon: Zap, verb: "" }

function getAutoKind(code: string | null): AutoKind {
  if (code && AUTO_KIND[code]) return AUTO_KIND[code]
  return DEFAULT_KIND
}

function getRowText(kind: AutoKind, fallbackLabel: string) {
  return kind.verb || fallbackLabel
}

function AutoLogRow({ log }: { log: ActivityLog }) {
  const kind = getAutoKind(log.activityType.code)
  const Icon = kind.icon
  const rowText = getRowText(kind, log.activityType.label)
  const badge = useBadgeColors(log.activityType.color || "#22d3ee", "solid")

  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-2.5 py-2.5"
      style={{ backgroundColor: badge.background, color: badge.text }}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
      >
        <Icon size={14} strokeWidth={2.5} style={{ color: badge.text }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-wide" style={{ color: badge.text }}>
          {rowText}
        </p>
        {log.project && (
          <p className="mt-0.5 truncate text-xs font-medium" style={{ color: badge.textMuted }}>
            {log.project.projectCode} · {log.project.name}
            {log.task &&
              ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs tabular-nums" style={{ color: badge.textMuted }}>
        {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  )
}

export function AutoActivitySection({ logs }: Props) {
  if (logs.length === 0) return null

  return (
    <div className="rounded-2xl bg-foreground/5 p-4">
      <div className="flex items-center gap-2.5">
        <Zap size={16} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          Actividad automática
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {logs.map(log => (
          <AutoLogRow key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}

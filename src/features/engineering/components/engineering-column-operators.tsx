"use client"

import type { CSSProperties, ComponentType } from "react"
import { Clock, Users, Zap } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import { cn } from "@/shared/utils/utils"

import type { EngineeringTask } from "../types/engineering-task.types"

type Entry = {
  assignee: NonNullable<EngineeringTask["assignee"]>
  status: EngineeringTask["status"]
  taskNumber: number
  title: string
}

type OperatorGroup = {
  assignee: NonNullable<EngineeringTask["assignee"]>
  entries: Entry[]
  primaryStatus: EngineeringTask["status"]
}

const ACTIVE: EngineeringTask["status"][] = ["QUEUE", "PENDING", "PROGRESS"]

export function getActiveAssigneeEntries(tasks: EngineeringTask[]): Entry[] {
  const entries: Entry[] = []
  for (const t of tasks) {
    if (!t.assignee || !ACTIVE.includes(t.status)) continue
    entries.push({
      assignee: t.assignee,
      status: t.status,
      taskNumber: t.taskNumber,
      title: t.title,
    })
  }
  return entries.sort((a, b) => {
    if (a.status === "PROGRESS" && b.status !== "PROGRESS") return -1
    if (b.status === "PROGRESS" && a.status !== "PROGRESS") return 1
    return 0
  })
}

function groupByOperator(entries: Entry[]): OperatorGroup[] {
  const map = new Map<string, OperatorGroup>()
  for (const e of entries) {
    const id = e.assignee.id
    const g = map.get(id)
    if (!g) {
      map.set(id, {
        assignee: e.assignee,
        entries: [e],
        primaryStatus: e.status,
      })
      continue
    }
    g.entries.push(e)
    if (e.status === "PROGRESS") g.primaryStatus = "PROGRESS"
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.primaryStatus === "PROGRESS" && b.primaryStatus !== "PROGRESS")
      return -1
    if (b.primaryStatus === "PROGRESS" && a.primaryStatus !== "PROGRESS")
      return 1
    return a.assignee.name.localeCompare(b.assignee.name)
  })
}

function statusMeta(status: EngineeringTask["status"]) {
  const isWorking = status === "PROGRESS"
  return {
    color: isWorking ? "#22C55E" : "#64748B",
    label: isWorking ? "Trabajando" : "En espera",
    Icon: isWorking ? Zap : Clock,
  }
}

/** Chip con contraste garantizado light/dark (useBadgeColors). */
function OperatorChip({
  name,
  color,
  iconName,
  extra,
}: {
  name: string
  color: string
  iconName?: string | null
  extra?: number
}) {
  const badge = useBadgeColors(color || "#64748B", "subtle")
  const Icon =
    iconName && iconName in ENTITY_ICONS
      ? ENTITY_ICONS[iconName as keyof typeof ENTITY_ICONS]
      : null

  return (
    <span
      className="inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5"
      style={{ backgroundColor: badge.background, color: badge.text }}
    >
      {Icon ? (
        <Icon size={11} className="shrink-0" style={{ color: badge.text }} />
      ) : (
        <span className="text-[9px] font-bold">{name.charAt(0)}</span>
      )}
      <span className="truncate text-[11px] font-semibold">{name}</span>
      {extra != null && extra > 0 && (
        <span className="shrink-0 text-[10px] font-bold opacity-80">
          +{extra}
        </span>
      )}
    </span>
  )
}

function StatusChip({ status }: { status: EngineeringTask["status"] }) {
  const meta = statusMeta(status)
  const badge = useBadgeColors(meta.color, "subtle")
  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: badge.background, color: badge.text }}
    >
      <meta.Icon size={11} style={{ color: badge.text }} />
      {meta.label}
    </span>
  )
}

function EntryLine({ entry }: { entry: Entry }) {
  const sm = statusMeta(entry.status)
  const badge = useBadgeColors(sm.color, "subtle")
  return (
    <li className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <sm.Icon size={10} className="shrink-0" style={{ color: badge.text }} />
      <span className="min-w-0 truncate">
        #{entry.taskNumber} · {entry.title}
      </span>
    </li>
  )
}

function OperatorDetailRow({
  name,
  color,
  Icon,
  entries,
  primaryStatus,
}: {
  name: string
  color: string
  Icon: ComponentType<{
    size?: number
    className?: string
    style?: CSSProperties
  }> | null
  entries: Entry[]
  primaryStatus: EngineeringTask["status"]
}) {
  const badge = useBadgeColors(color, "subtle")
  return (
    <div className="rounded-lg bg-foreground/5 px-2 py-1.5">
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon size={14} style={{ color: badge.text }} className="shrink-0" />
        ) : (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: badge.background, color: badge.text }}
          >
            {name.charAt(0)}
          </span>
        )}
        <span
          className="min-w-0 flex-1 truncate text-xs font-semibold"
          style={{ color: badge.text }}
        >
          {name}
          {entries.length > 1 && (
            <span className="ml-1 opacity-70">· {entries.length} tareas</span>
          )}
        </span>
        <StatusChip status={primaryStatus} />
      </div>
      <ul className="mt-1 space-y-0.5 pl-6">
        {entries.map(e => (
          <EntryLine key={`${e.taskNumber}-${e.title}`} entry={e} />
        ))}
      </ul>
    </div>
  )
}

/**
 * Franja bajo título de proceso.
 * Un chip por operario (si tiene N tareas → +N). Detalle en popover.
 */
export function EngineeringColumnOperators({
  tasks,
}: {
  tasks: EngineeringTask[]
}) {
  const entries = getActiveAssigneeEntries(tasks)
  const groups = groupByOperator(entries)
  const workingCount = entries.filter(e => e.status === "PROGRESS").length

  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-0.5 py-0.5 text-[11px] text-muted-foreground">
        <Users size={12} className="shrink-0 opacity-60" />
        <span>Sin operario asignado</span>
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full min-w-0 items-center gap-1.5 rounded-lg px-0.5 py-0.5 text-left",
            "transition-colors hover:bg-foreground/[0.04]",
          )}
        >
          <Users size={12} className="shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {groups.slice(0, 3).map(g => (
              <OperatorChip
                key={g.assignee.id}
                name={g.assignee.name}
                color={g.assignee.color ?? "#64748B"}
                iconName={g.assignee.icon}
                extra={g.entries.length - 1}
              />
            ))}
            {groups.length > 3 && (
              <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                +{groups.length - 3}
              </span>
            )}
          </div>
          {workingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/22 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Zap size={10} />
              {workingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-full p-3">
        <div className="px-1 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Asignados en este proceso
        </div>
        <div className="flex flex-col gap-2">
          {groups.map(g => {
            const color = g.assignee.color ?? "#64748B"
            const Icon =
              g.assignee.icon && g.assignee.icon in ENTITY_ICONS
                ? ENTITY_ICONS[g.assignee.icon as keyof typeof ENTITY_ICONS]
                : null
            return (
              <OperatorDetailRow
                key={g.assignee.id}
                name={g.assignee.name}
                color={color}
                Icon={Icon}
                entries={g.entries}
                primaryStatus={g.primaryStatus}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

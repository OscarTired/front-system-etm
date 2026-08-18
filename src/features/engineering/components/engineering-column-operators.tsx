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

/** Chip con contraste garantizado y badge circular con opacidad nativa. */
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
      className="inline-flex h-7 max-w-[10rem] shrink-0 items-center gap-1.5 rounded-lg px-2.5 transition-transform duration-150 active:scale-95"
      style={{ backgroundColor: badge.background, color: badge.text }}
    >
      {Icon ? (
        <Icon size={13} className="shrink-0" style={{ color: badge.text }} />
      ) : (
        <span className="text-[10px] font-bold">{name.charAt(0)}</span>
      )}
      <span className="truncate text-xs font-semibold">{name}</span>
      {extra != null && extra > 0 && (
        <span className="inline-flex size-4 aspect-square shrink-0 items-center justify-center rounded-full bg-current/20 text-[9px] font-extrabold leading-none">
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
    <div className="rounded-lg bg-foreground/5 px-2.5 py-2">
      <div className="flex items-center gap-2">
        {/* Badge cuadrado redondeado con el fondo del color del operario */}
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: badge.background, color: badge.text }}
        >
          {Icon ? (
            <Icon size={12} style={{ color: badge.text }} />
          ) : (
            <span className="text-[10px] font-bold">{name.charAt(0)}</span>
          )}
        </span>

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
      <ul className="mt-1.5 space-y-1 pl-6">
        {entries.map(e => (
          <EntryLine key={`${e.taskNumber}-${e.title}`} entry={e} />
        ))}
      </ul>
    </div>
  )
}

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
      <div className="flex h-9 items-center gap-2 rounded-xl bg-foreground/[0.03] px-2.5 text-xs text-muted-foreground/70">
        <Users size={14} className="shrink-0 opacity-60" />
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
            "group flex w-full min-w-0 items-center gap-2 rounded-xl bg-foreground/[0.04] p-1.5 text-left backdrop-blur-sm transition-all duration-150",
            "hover:bg-foreground/[0.08] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors group-hover:text-foreground">
            <Users size={15} strokeWidth={2} />
          </div>

          <div className="h-4 w-px shrink-0 bg-border/40" />

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
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
              <span className="shrink-0 px-1 text-xs font-semibold text-muted-foreground">
                +{groups.length - 3}
              </span>
            )}
          </div>

          {workingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Zap size={11} />
              {workingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-80 p-3">
        <div className="px-1 pb-2 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
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
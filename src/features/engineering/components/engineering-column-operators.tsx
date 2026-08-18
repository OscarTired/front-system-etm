"use client"

import { Clock, Users, Zap } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
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
  /** PRIORIDAD: si alguno está PROGRESS → trabajando. */
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

  if (groups.length === 0) {
    return (
      <div className="flex h-10 items-center gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground/80">
          Sin operario asignado
        </span>
      </div>
    )
  }

  const workingCount = groups.filter(g => g.primaryStatus === "PROGRESS").length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full min-w-0 items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5 text-left transition-colors hover:bg-muted"
        >
          <Users size={13} className="shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {groups.slice(0, 3).map(g => {
              const color = g.assignee.color ?? "#64748B"
              const Icon = g.assignee.icon
                ? ENTITY_ICONS[g.assignee.icon]
                : null
              const extra = g.entries.length - 1
              return (
                <span
                  key={g.assignee.id}
                  className="inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {Icon ? (
                    <Icon size={11} className="shrink-0" />
                  ) : (
                    <span className="text-[9px] font-bold">
                      {g.assignee.name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate text-[11px] font-semibold">
                    {g.assignee.name}
                  </span>
                  {extra > 0 && (
                    <span className="shrink-0 text-[10px] font-bold opacity-80">
                      +{extra}
                    </span>
                  )}
                </span>
              )
            })}
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

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-full p-3"
      >
        <div className="px-1 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Asignados en este proceso
        </div>
        <div className="flex flex-col gap-2">
          {groups.map(g => {
            const color = g.assignee.color ?? "#64748B"
            const Icon = g.assignee.icon
              ? ENTITY_ICONS[g.assignee.icon]
              : null
            const { color: stColor, label, Icon: StatusIcon } = statusMeta(
              g.primaryStatus,
            )
            return (
              <div
                key={g.assignee.id}
                className="rounded-lg bg-foreground/5 px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  {Icon ? (
                    <Icon size={14} style={{ color }} className="shrink-0" />
                  ) : (
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: `${color}30`, color }}
                    >
                      {g.assignee.name.charAt(0)}
                    </span>
                  )}
                  <span
                    className="min-w-0 flex-1 truncate text-xs font-semibold"
                    style={{ color }}
                  >
                    {g.assignee.name}
                    {g.entries.length > 1 && (
                      <span className="ml-1 opacity-70">
                        · {g.entries.length} tareas
                      </span>
                    )}
                  </span>
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: `${stColor}18`, color: stColor }}
                  >
                    <StatusIcon size={11} />
                    {label}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5 pl-6">
                  {g.entries.map(e => {
                    const sm = statusMeta(e.status)
                    return (
                      <li
                        key={`${e.taskNumber}-${e.title}`}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <sm.Icon
                          size={10}
                          className="shrink-0"
                          style={{ color: sm.color }}
                        />
                        <span className="min-w-0 truncate">
                          #{e.taskNumber} · {e.title}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

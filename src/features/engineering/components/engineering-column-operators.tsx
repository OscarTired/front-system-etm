"use client"

import { Clock, Users, Zap } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { MarqueeText } from "@/shared/ui/marquee-text/marquee-text"
import { cn } from "@/shared/utils/utils"

import type { EngineeringTask } from "../types/engineering-task.types"

type Entry = {
  assignee: NonNullable<EngineeringTask["assignee"]>
  status: EngineeringTask["status"]
  taskNumber: number
  title: string
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

function OperatorRow({ entry }: { entry: Entry }) {
  const { assignee, status, taskNumber, title } = entry
  const isWorking = status === "PROGRESS"
  const OperatorIcon = assignee.icon ? ENTITY_ICONS[assignee.icon] : null
  const statusColor = isWorking ? "#22C55E" : "#64748B"
  const statusLabel = isWorking ? "Trabajando" : "En espera"
  const StatusIcon = isWorking ? Zap : Clock
  const color = assignee.color ?? "#64748B"

  return (
    <div className="grid h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1">
      <div
        className="flex min-w-0 items-center gap-1.5 overflow-hidden rounded-lg px-2 py-1"
        style={{ backgroundColor: `${color}14` }}
      >
        {OperatorIcon ? (
          <OperatorIcon size={13} style={{ color }} className="shrink-0" />
        ) : (
          <span
            className="flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            style={{ backgroundColor: `${color}30`, color }}
          >
            {assignee.name.charAt(0).toUpperCase()}
          </span>
        )}
        <MarqueeText className="min-w-0 flex-1" always delay={2.5}>
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color }}>
            {assignee.name}
          </span>
          <span
            className="shrink-0 text-xs font-semibold opacity-60 whitespace-nowrap"
            style={{ color }}
          >
            #{taskNumber} · {title}
          </span>
        </MarqueeText>
      </div>
      <div
        title={statusLabel}
        aria-label={statusLabel}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${statusColor}14`, color: statusColor }}
      >
        <StatusIcon size={12} className="shrink-0" />
      </div>
    </div>
  )
}

function ActiveOperatorsPopover({ entries }: { entries: Entry[] }) {
  const { isMobile } = useResponsive()
  const workingCount = entries.filter(e => e.status === "PROGRESS").length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5 text-left transition-colors hover:bg-muted",
            isMobile ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <Users size={13} className="shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-semibold text-foreground">
              {entries.length} operarios activos
            </span>
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
        className="w-(--radix-popover-trigger-width) p-2"
      >
        <div className="px-1 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Asignados en este proceso
        </div>
        <div className="flex flex-col gap-1">
          {entries.map(entry => (
            <OperatorRow
              key={`${entry.assignee.id}-${entry.taskNumber}`}
              entry={entry}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Franja bajo título de columna — mismo patrón que TaskColumnOperator. */
export function EngineeringColumnOperators({
  tasks,
}: {
  tasks: EngineeringTask[]
}) {
  const { isMobile } = useResponsive()
  const entries = getActiveAssigneeEntries(tasks)

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex h-10 items-center gap-2 px-1",
          isMobile && "justify-center",
        )}
      >
        <span className="text-xs font-medium text-muted-foreground/80">
          Sin operario asignado
        </span>
      </div>
    )
  }

  if (entries.length === 1) return <OperatorRow entry={entries[0]} />
  return <ActiveOperatorsPopover entries={entries} />
}

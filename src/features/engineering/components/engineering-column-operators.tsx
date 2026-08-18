"use client"

import { Clock, Users, Zap } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
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

function statusMeta(status: EngineeringTask["status"]) {
  const isWorking = status === "PROGRESS"
  return {
    isWorking,
    color: isWorking ? "#22C55E" : "#64748B",
    label: isWorking ? "Trabajando" : "En espera",
    Icon: isWorking ? Zap : Clock,
  }
}

/** Fila desktop: nombre + tarea truncados, texto e icono de status. */
function OperatorRow({ entry }: { entry: Entry }) {
  const { assignee, status, taskNumber, title } = entry
  const { color: statusColor, label: statusLabel, Icon: StatusIcon } =
    statusMeta(status)
  const OperatorIcon = assignee.icon ? ENTITY_ICONS[assignee.icon] : null
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
        <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color }}>
          {assignee.name}
          <span className="opacity-60">
            {" "}
            · #{taskNumber} · {title}
          </span>
        </span>
      </div>
      <div
        title={statusLabel}
        className="flex h-7 shrink-0 items-center gap-1 rounded-lg px-1.5"
        style={{ backgroundColor: `${statusColor}14`, color: statusColor }}
      >
        <StatusIcon size={12} className="shrink-0" />
        <span className="text-[10px] font-semibold">{statusLabel}</span>
      </div>
    </div>
  )
}

function ActiveOperatorsPopover({ entries }: { entries: Entry[] }) {
  const workingCount = entries.filter(e => e.status === "PROGRESS").length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-muted/50 px-2 py-1.5 text-left transition-colors hover:bg-muted"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <Users size={13} className="shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-semibold text-foreground">
              {entries.length}{" "}
              {entries.length === 1 ? "operario activo" : "operarios activos"}
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
        className="w-(--radix-popover-trigger-width) max-w-sm p-2"
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

/**
 * Franja bajo título de proceso.
 * Mobile: siempre popover. Desktop: filas inline (texto + icono status).
 */
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

  // Mobile: popover (evita marquee / filas apretadas).
  if (isMobile) {
    return <ActiveOperatorsPopover entries={entries} />
  }

  // Desktop: lista inline.
  if (entries.length === 1) return <OperatorRow entry={entries[0]} />
  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(entry => (
        <OperatorRow
          key={`${entry.assignee.id}-${entry.taskNumber}`}
          entry={entry}
        />
      ))}
    </div>
  )
}

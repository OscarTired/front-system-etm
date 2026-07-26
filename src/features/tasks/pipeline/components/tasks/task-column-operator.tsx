"use client"

import { Clock, Users, Zap } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { MarqueeText } from "@/shared/ui/marquee-text/marquee-text"
import { cn } from "@/shared/utils/utils"

import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import type { WorkflowStep } from "@/features/workflow/types/workflow.types"

type Props = {
  processCode: ProcessCode
  tasks: Task[]
}

export type ActiveEntry = {
  operator: NonNullable<WorkflowStep["operator"]>
  status: WorkflowStep["status"]
  taskNumber: number
}

// Estados en los que el operario sigue "vivo" en esta estación: ya fue
// asignado pero la tarea todavía no salió de esta columna.
const ACTIVE_STATUSES: WorkflowStep["status"][] = [
  "PENDING",
  "PROGRESS",
  "PAUSED",
]

export function getActiveOperatorEntries(
  tasks: Task[],
  processCode: ProcessCode,
): ActiveEntry[] {

  const entries: ActiveEntry[] = []

  for (const task of tasks) {

    const step = task.workflowSteps.find(
      s =>
        s.processCode === processCode &&
        s.operator &&
        ACTIVE_STATUSES.includes(s.status),
    )

    if (step?.operator) {

      entries.push({
        operator: step.operator,
        status: step.status,
        taskNumber: task.taskNumber,
      })

    }

  }

  // Los que están trabajando ahora mismo van primero.
  return entries.sort((a, b) => {

    if (a.status === "PROGRESS" && b.status !== "PROGRESS") {
      return -1
    }

    if (b.status === "PROGRESS" && a.status !== "PROGRESS") {
      return 1
    }

    return 0

  })

}

function OperatorRow({
  entry,
}: {
  entry: ActiveEntry
}) {

  const { isMobile } = useResponsive()

  const { operator, status, taskNumber } = entry

  const isWorking = status === "PROGRESS"

  const OperatorIcon =
    operator.icon
      ? ENTITY_ICONS[operator.icon]
      : null

  const statusColor =
    isWorking ? "#22C55E" : "#64748B"

  const statusLabel =
    isWorking ? "Trabajando" : "En espera"

  const StatusIcon =
    isWorking ? Zap : Clock

  return (

    <div
      className={cn(
        "flex h-10 items-center gap-2 px-1",
        // En desktop, columna angosta (w-72): separar operario y
        // estado a los extremos (justify-between) usa bien el poco
        // ancho disponible. En mobile, a todo el ancho de pantalla,
        // separarlos a los extremos se sentía desparramado — se
        // centran como un solo grupo en cambio.
        isMobile ? "justify-center" : "justify-between",
      )}
    >

      {/* Badge del operario + tarea */}
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1",
          isMobile ? "shrink-0" : "flex-1",
        )}
        style={{
          backgroundColor: `${operator.color ?? "#64748B"}14`,
        }}
      >

        {OperatorIcon ? (

          <OperatorIcon
            size={13}
            style={{ color: operator.color ?? "#64748B" }}
            className="shrink-0"
          />

        ) : (

          <span
            className="flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            style={{
              backgroundColor: `${operator.color ?? "#64748B"}30`,
              color: operator.color ?? "#64748B",
            }}
          >
            {operator.name.charAt(0).toUpperCase()}
          </span>

        )}

        <MarqueeText className="min-w-0 flex-1">

          <span
            className="text-xs font-semibold whitespace-nowrap"
            style={{ color: operator.color ?? "#64748B" }}
          >
            {operator.name}
          </span>

          <span
            className="shrink-0 text-xs font-semibold opacity-60"
            style={{ color: operator.color ?? "#64748B" }}
          >
            #{taskNumber}
          </span>

        </MarqueeText>

      </div>

      {/* Badge de estado */}
      <div
        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1"
        style={{
          backgroundColor: `${statusColor}14`,
          color: statusColor,
        }}
      >

        <StatusIcon size={11} className="shrink-0" />

        <span className="text-[10px] font-bold uppercase tracking-wide">
          {statusLabel}
        </span>

      </div>

    </div>

  )

}

function ActiveOperatorsPopover({
  entries,
}: {
  entries: ActiveEntry[]
}) {

  const { isMobile } = useResponsive()

  const workingCount = entries.filter(
    e => e.status === "PROGRESS",
  ).length

  return (

    <Popover>

      <PopoverTrigger asChild>

        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg bg-neutral-800/50 px-2 py-1.5 text-left transition-colors hover:bg-neutral-800",
            isMobile ? "justify-center" : "justify-between",
          )}
        >

          <div className="flex min-w-0 items-center gap-1.5">

            <Users size={13} className="shrink-0 text-neutral-400" />

            <span className="truncate text-xs font-semibold text-neutral-200">
              {entries.length} operarios activos
            </span>

          </div>

          {workingCount > 0 && (

            <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
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

        <div className="px-1 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          Operarios en esta estación
        </div>

        <div className="flex flex-col gap-1">

          {entries.map(entry => (

            <OperatorRow
              key={`${entry.operator.id}-${entry.taskNumber}`}
              entry={entry}
            />

          ))}

        </div>

      </PopoverContent>

    </Popover>

  )

}

export function TaskColumnOperator({
  processCode,
  tasks,
}: Props) {

  const { isMobile } = useResponsive()

  const definition = PROCESS_DEFINITIONS[processCode]
  const badge = getBadgeColors(definition.color, "subtle")

  const entries = getActiveOperatorEntries(tasks, processCode)

  if (entries.length === 0) {

    return (

      <div
        className={cn(
          "flex h-10 items-center gap-2 px-1",
          isMobile && "justify-center",
        )}
      >

        <span className="text-xs font-medium text-neutral-600">
          Sin operario asignado
        </span>

      </div>

    )

  }

  if (entries.length === 1) {
    return <OperatorRow entry={entries[0]} />
  }

  return <ActiveOperatorsPopover entries={entries} />

}
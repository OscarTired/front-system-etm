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
  reference: string
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
        reference: task.reference,
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

  const { operator, status, taskNumber, reference } = entry

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
      // grid en vez de flex acá a propósito: con flex-1 + min-w-0
      // (lo que había antes) el navegador todavía podía dejar que el
      // contenido intrínseco de la píldora (el doble de ancho, por
      // el loop del marquee) empujara el layout — es una limitación
      // conocida de flexbox. minmax(0,1fr) en un grid-template-columns
      // SÍ es una cota dura: esa columna nunca crece más allá del
      // espacio que le toca, pase lo que pase adentro.
      className="grid h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1"
    >

      {/* Badge del operario + tarea */}
      <div
        className="flex min-w-0 items-center gap-1.5 overflow-hidden rounded-lg px-2 py-1"
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

        <MarqueeText className="min-w-0 flex-1" always>

          <span
            className="text-xs font-semibold whitespace-nowrap"
            style={{ color: operator.color ?? "#64748B" }}
          >
            {operator.name}
          </span>

          <span
            className="shrink-0 text-xs font-semibold opacity-60 whitespace-nowrap"
            style={{ color: operator.color ?? "#64748B" }}
          >
            #{taskNumber} · {reference}
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

            <Users size={13} className="shrink-0 text-muted-foreground" />

            <span className="truncate text-xs font-semibold text-foreground">
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

        <div className="px-1 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
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

        <span className="text-xs font-medium text-muted-foreground/80">
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
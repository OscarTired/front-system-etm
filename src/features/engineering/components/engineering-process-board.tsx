"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"

import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  ENGINEERING_PROCESS_ORDER,
  type EngineeringProcessCode,
} from "../constants/engineering-process-definitions"
import { useEngineeringProcessCatalog } from "../hooks/use-engineering-process-catalog"
import type { EngineeringTask } from "../types/engineering-task.types"
import { EngineeringTaskRow } from "./engineering-task-row"
import { EngineeringKpiHeader } from "./engineering-kpi-header"
import { EngineeringColumnOperators } from "./engineering-column-operators"

type Props = {
  tasks: EngineeringTask[]
  loading?: boolean
  onCreateInProcess?: (code: EngineeringProcessCode) => void
  onEditTask?: (task: EngineeringTask) => void
}

function groupByProcess(tasks: EngineeringTask[]) {
  const map = new Map<EngineeringProcessCode, EngineeringTask[]>()
  for (const code of ENGINEERING_PROCESS_ORDER) map.set(code, [])
  for (const t of tasks) {
    const list = map.get(t.processCode as EngineeringProcessCode)
    if (list) list.push(t)
  }
  return map
}

function ProcessSectionHeader({
  code,
  count,
  onAdd,
}: {
  code: EngineeringProcessCode
  count: number
  onAdd?: () => void
}) {
  const { resolve } = useEngineeringProcessCatalog()
  const def = resolve(code)
  const label = def?.label ?? code
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-1 pb-2">
      {def ? (
        <EntityChip
          label={def.label}
          color={def.color}
          icon={def.icon}
          compact
        />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">{code}</span>
      )}
      <span className="min-w-0 flex-1" />
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {count}
      </span>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Nueva tarea en ${label}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/**
 * Ingeniería por proceso — lista vertical (sin carrusel horizontal).
 */
export function EngineeringProcessBoard({
  tasks,
  loading,
  onCreateInProcess,
  onEditTask,
}: Props) {
  const byProcess = useMemo(() => groupByProcess(tasks), [tasks])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-1 animate-pulse">
        <div className="h-16 rounded-2xl bg-foreground/5" />
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl bg-foreground/5 p-3"
          >
            <div className="h-4 w-40 rounded bg-foreground/10" />
            <div className="h-10 rounded-lg bg-foreground/5" />
            <div className="h-12 rounded-xl bg-foreground/5" />
            <div className="h-12 rounded-xl bg-foreground/5 opacity-70" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="mb-3 shrink-0">
        <EngineeringKpiHeader tasks={tasks} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 pb-4">
          {ENGINEERING_PROCESS_ORDER.map(code => {
            const colTasks = byProcess.get(code) ?? []
            return (
              <section
                key={code}
                className="flex flex-col gap-2 rounded-2xl bg-foreground/[0.03] p-3"
              >
                <ProcessSectionHeader
                  code={code}
                  count={colTasks.length}
                  onAdd={
                    onCreateInProcess
                      ? () => onCreateInProcess(code)
                      : undefined
                  }
                />
                <EngineeringColumnOperators tasks={colTasks} />
                <div className="flex flex-col gap-1.5">
                  {colTasks.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      Sin tareas
                    </p>
                  ) : (
                    colTasks.map(task => (
                      <EngineeringTaskRow
                        key={task.id}
                        task={task}
                        onEdit={onEditTask}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

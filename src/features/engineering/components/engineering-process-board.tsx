"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"

import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"

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
  loading,
}: {
  code: EngineeringProcessCode
  count: number
  onAdd?: () => void
  loading?: boolean
}) {
  const { resolve } = useEngineeringProcessCatalog()
  const def = resolve(code)
  const label = def?.label ?? code

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/60 pb-2.5">
      <div className="flex items-center gap-2">
        {def ? (
          <EntityChip
            label={def.label}
            color={def.color}
            icon={def.icon}
            compact
          />
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">
            {code}
          </span>
        )}

        {/* Badge de contador con el mismo tamaño y estilo integrado que los chips */}
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-foreground/10 px-2 text-xs font-bold tabular-nums text-foreground/80">
          {count}
        </span>
      </div>

      {onAdd && !loading && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Nueva tarea en ${label}`}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/**
 * Ingeniería por proceso — Grid adaptativo de alta densidad.
 */
export function EngineeringProcessBoard({
  tasks,
  loading,
  onCreateInProcess,
  onEditTask,
}: Props) {
  const byProcess = useMemo(() => groupByProcess(tasks), [tasks])

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-1 flex-col transition-opacity duration-200",
        loading && "pointer-events-none select-none opacity-60 animate-pulse"
      )}
    >
      {/* Header de KPIs */}
      <div className="mb-4 shrink-0">
        <EngineeringKpiHeader tasks={tasks} />
      </div>

      {/* Grid de Procesos */}
      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className="grid grid-cols-1 gap-4 pb-6 xl:grid-cols-2">
          {ENGINEERING_PROCESS_ORDER.map(code => {
            const colTasks = byProcess.get(code) ?? []

            return (
              <section
                key={code}
                className="flex flex-col gap-3 rounded-2xl border-0 bg-card/60 p-3.5 backdrop-blur-sm transition-colors hover:border-border/80"
              >
                {/* Cabecera del Proceso */}
                <ProcessSectionHeader
                  code={code}
                  count={colTasks.length}
                  loading={loading}
                  onAdd={
                    onCreateInProcess
                      ? () => onCreateInProcess(code)
                      : undefined
                  }
                />

                {/* Filtro de Operadores por Proceso */}
                <EngineeringColumnOperators tasks={colTasks} />

                {/* Listado de Tareas */}
                <div className="flex flex-col gap-2">
                  {colTasks.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border/40 bg-background/20">
                      <p className="text-xs text-muted-foreground/60">
                        Sin tareas asignadas
                      </p>
                    </div>
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
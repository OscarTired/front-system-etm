"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { cn } from "@/shared/utils/utils"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import {
  ProcessBoard,
  ProcessBoardColumnFrame,
  ProcessBoardSkeleton,
  type ProcessBoardColumn,
} from "@/shared/ui/process-board"

import {
  ENGINEERING_PROCESS_DEFINITIONS,
  ENGINEERING_PROCESS_ORDER,
  type EngineeringProcessCode,
} from "../constants/engineering-process-definitions"
import type { EngineeringTask } from "../types/engineering-task.types"
import { EngineeringTaskRow } from "./engineering-task-row"
import { EngineeringColumnOperators } from "./engineering-column-operators"
import { EngineeringKpiHeader } from "./engineering-kpi-header"

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
    const list = map.get(t.processCode)
    if (list) list.push(t)
    else map.set(t.processCode, [t])
  }
  return map
}

function ProcessColumnHeader({
  code,
  count,
  centered = false,
  onAdd,
}: {
  code: EngineeringProcessCode
  count: number
  centered?: boolean
  onAdd?: () => void
}) {
  const theme = useThemeStore(s => s.resolved)
  const def = ENGINEERING_PROCESS_DEFINITIONS[code]
  const Icon = ENTITY_ICONS[def.icon]
  const badge = getBadgeColors(def.color, "subtle", theme)
  const { has } = usePermissions()
  const canCreate = has(PermissionCode.TASK_CREATE)

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 border-b px-2",
        centered && "justify-center",
      )}
      style={{ borderColor: def.color }}
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
        style={{ color: badge.text, backgroundColor: badge.background }}
      >
        {def.short}
      </span>
      {Icon && (
        <Icon size={14} style={{ color: def.color }} className="shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide text-foreground">
        {def.label}
      </span>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
        {count}
      </span>
      {canCreate && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          title="Nueva tarea en este proceso"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground transition hover:bg-foreground/10 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/**
 * Board de procesos de ingeniería.
 * Layout 100% vía ProcessBoard + ProcessBoardColumnFrame (shared).
 * Sin hacks de scroll/altura locales.
 */
export function EngineeringProcessBoard({
  tasks,
  loading,
  onCreateInProcess,
  onEditTask,
}: Props) {
  const { isMobile } = useResponsive()
  const byProcess = useMemo(() => groupByProcess(tasks), [tasks])

  const columns: ProcessBoardColumn<EngineeringProcessCode>[] = useMemo(
    () =>
      ENGINEERING_PROCESS_ORDER.map(code => {
        const colTasks = byProcess.get(code) ?? []
        return {
          id: code,
          content: (
            <ProcessBoardColumnFrame
              header={
                <ProcessColumnHeader
                  code={code}
                  count={colTasks.length}
                  centered={isMobile}
                  onAdd={
                    onCreateInProcess
                      ? () => onCreateInProcess(code)
                      : undefined
                  }
                />
              }
              meta={<EngineeringColumnOperators tasks={colTasks} />}
            >
              <div className="flex flex-col gap-1.5 px-0.5 pb-2 pt-1">
                {colTasks.length === 0 ? (
                  <p className="px-2 py-8 text-center text-xs text-muted-foreground">
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
            </ProcessBoardColumnFrame>
          ),
        }
      }),
    [byProcess, isMobile, onCreateInProcess, onEditTask],
  )

  return (
    <ProcessBoard
      columns={columns}
      loading={loading}
      loadingFallback={
        <ProcessBoardSkeleton
          accentColor="#16A34A"
          columnCount={ENGINEERING_PROCESS_ORDER.length}
        />
      }
      header={<EngineeringKpiHeader tasks={tasks} />}
      columnClassName="w-72 min-w-72 shrink-0"
      scrollStep={288}
    />
  )
}

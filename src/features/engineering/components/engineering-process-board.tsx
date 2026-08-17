"use client"

import { useMemo } from "react"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { cn } from "@/shared/utils/utils"
import {
  ENGINEERING_PROCESS_DEFINITIONS,
  ENGINEERING_PROCESS_ORDER,
  type EngineeringProcessCode,
} from "../constants/engineering-process-definitions"
import type { EngineeringTask } from "../types/engineering-task.types"
import { EngineeringTaskRow } from "./engineering-task-row"

type Props = {
  tasks: EngineeringTask[]
  loading?: boolean
}

function groupByProcess(tasks: EngineeringTask[]) {
  const map = new Map<EngineeringProcessCode, EngineeringTask[]>()
  for (const code of ENGINEERING_PROCESS_ORDER) {
    map.set(code, [])
  }
  for (const t of tasks) {
    const list = map.get(t.processCode)
    if (list) list.push(t)
    else map.set(t.processCode, [t])
  }
  return map
}

export function EngineeringProcessBoard({ tasks, loading }: Props) {
  const { isMobile } = useResponsive()
  const theme = useThemeStore(s => s.resolved)
  const columns = useMemo(() => groupByProcess(tasks), [tasks])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  // Mobile: una columna a la vez (snap) — desktop: grid horizontal scroll
  return (
    <div
      className={cn(
        "flex min-h-0 w-full gap-3",
        isMobile
          ? "snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-2 [touch-action:pan-x]"
          : "overflow-x-auto pb-2",
      )}
    >
      {ENGINEERING_PROCESS_ORDER.map(code => {
        const def = ENGINEERING_PROCESS_DEFINITIONS[code]
        const colTasks = columns.get(code) ?? []
        const Icon = ENTITY_ICONS[def.icon]
        const badge = getBadgeColors(def.color, theme)

        return (
          <div
            key={code}
            className={cn(
              "flex shrink-0 flex-col",
              isMobile
                ? "w-full snap-center [touch-action:pan-y]"
                : "w-72",
            )}
          >
            <div
              className="flex h-10 items-center justify-center gap-2 border-b px-3"
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
              <span className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                {def.label}
              </span>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-1.5 px-0.5">
              {colTasks.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Sin tareas
                </p>
              ) : (
                colTasks.map(task => (
                  <EngineeringTaskRow key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

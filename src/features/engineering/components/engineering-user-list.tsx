"use client"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import type { User } from "@/features/users/types/user.types"
import type { EngineeringTask } from "../types/engineering-task.types"
import {
  ENGINEERING_PROCESS_DEFINITIONS,
} from "../constants/engineering-process-definitions"

type Props = {
  users: User[]
  tasks: EngineeringTask[]
  loading?: boolean
}

/**
 * Tab Lista: usuarios (ingeniería) con resumen de tareas asignadas.
 * Filosofía TaskAreaPanel (acciones por persona), no panel flotante.
 */
export function EngineeringUserList({ users, tasks, loading }: Props) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-foreground/5 text-sm text-muted-foreground">
        Sin usuarios para mostrar
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3 pb-4">
      {users.map(user => {
        const assigned = tasks.filter(t => t.assigneeId === user.id)
        const inProgress = assigned.filter(t => t.status === "PROGRESS")
        const byProcess = new Map<string, number>()
        for (const t of assigned) {
          byProcess.set(t.processCode, (byProcess.get(t.processCode) ?? 0) + 1)
        }

        return (
          <div
            key={user.id}
            className="flex flex-col gap-2 rounded-2xl bg-foreground/5 p-3 transition hover:bg-foreground/10"
          >
            <div className="flex items-center justify-between gap-2">
              <DynamicBadge
                label={user.name}
                color={user.color}
                icon={user.icon}
                width="field"
              />
              <div className="flex shrink-0 items-center gap-2">
                {inProgress.length > 0 && (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Trabajando
                  </span>
                )}
                <span className="rounded-lg bg-foreground/5 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {assigned.length}{" "}
                  {assigned.length === 1 ? "tarea" : "tareas"}
                </span>
              </div>
            </div>

            {byProcess.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {[...byProcess.entries()].map(([code, count]) => {
                  const def =
                    ENGINEERING_PROCESS_DEFINITIONS[
                      code as keyof typeof ENGINEERING_PROCESS_DEFINITIONS
                    ]
                  if (!def) return null
                  return (
                    <span
                      key={code}
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${def.color}22`,
                        color: def.color,
                      }}
                    >
                      {def.short} · {count}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

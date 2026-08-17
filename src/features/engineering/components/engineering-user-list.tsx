"use client"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import type { User } from "@/features/users/types/user.types"
import type { EngineeringTask } from "../types/engineering-task.types"
import {
  ENGINEERING_PROCESS_DEFINITIONS,
} from "../constants/engineering-process-definitions"
import { EngineeringTaskRow } from "./engineering-task-row"

type Props = {
  users: User[]
  tasks: EngineeringTask[]
  loading?: boolean
}

/**
 * Tab Lista — formato Team Bitácora (secciones por persona)
 * + filas estilo pipeline.
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
      <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-foreground/5 text-sm text-muted-foreground">
        Sin usuarios para mostrar
      </div>
    )
  }

  // Usuarios con al menos una tarea primero; luego el resto
  const withTasks = users
    .map(u => ({
      user: u,
      tasks: tasks.filter(t => t.assigneeId === u.id),
    }))
    .sort((a, b) => b.tasks.length - a.tasks.length)

  return (
    <div className="flex w-full flex-col gap-6 pb-4">
      {withTasks.map(({ user, tasks: assigned }) => {
        const inProgress = assigned.some(t => t.status === "PROGRESS")
        const byProcess = new Map<string, number>()
        for (const t of assigned) {
          byProcess.set(
            t.processCode,
            (byProcess.get(t.processCode) ?? 0) + 1,
          )
        }

        return (
          <section key={user.id} className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex min-w-0 items-center gap-2">
                <DynamicBadge
                  label={user.name}
                  color={user.color}
                  icon={user.icon}
                  width="field"
                />
                {inProgress && (
                  <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Trabajando
                  </span>
                )}
              </div>
              <div className="rounded-lg bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                {assigned.length}{" "}
                {assigned.length === 1 ? "tarea" : "tareas"}
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

            {assigned.length === 0 ? (
              <div className="flex h-16 items-center justify-center rounded-2xl bg-foreground/5 text-xs text-muted-foreground">
                Sin tareas asignadas
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {assigned.map(task => (
                  <EngineeringTaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

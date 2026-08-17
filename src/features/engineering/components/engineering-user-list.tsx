"use client"

import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import type { EntityIcon } from "@/shared/constants/entity-icons"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import type { User } from "@/features/users/types/user.types"
import { cn } from "@/shared/utils/utils"

import type { EngineeringTask } from "../types/engineering-task.types"
import {
  ENGINEERING_PROCESS_DEFINITIONS,
} from "../constants/engineering-process-definitions"
import { EngineeringTaskRow } from "./engineering-task-row"

type Props = {
  users: User[]
  tasks: EngineeringTask[]
  loading?: boolean
  onEditTask?: (task: EngineeringTask) => void
  onCreateForUser?: (userId: string) => void
}

function UserAvatar({
  name,
  color,
  icon,
}: {
  name: string
  color: string
  icon?: EntityIcon
}) {
  const Icon = icon ? ENTITY_ICONS[icon] : undefined
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        backgroundColor: `${color}28`,
        color,
      }}
    >
      {Icon ? <Icon size={15} /> : initial}
    </div>
  )
}

/** Lista por persona — lenguaje TeamSupervisionUserRow. */
export function EngineeringUserList({
  users,
  tasks,
  loading,
  onEditTask,
  onCreateForUser,
}: Props) {
  const { has } = usePermissions()
  const canCreate = has(PermissionCode.TASK_CREATE)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
        Sin usuarios con rol Ingeniería
      </div>
    )
  }

  const withTasks = users
    .map(u => ({
      user: u,
      tasks: tasks.filter(t => t.assigneeId === u.id),
    }))
    .sort((a, b) => b.tasks.length - a.tasks.length)

  const working = withTasks.filter(x =>
    x.tasks.some(t => t.status === "PROGRESS"),
  )
  const withAssigned = withTasks.filter(
    x =>
      x.tasks.length > 0 &&
      !x.tasks.some(t => t.status === "PROGRESS"),
  )
  const idle = withTasks.filter(x => x.tasks.length === 0)

  const sections: {
    key: string
    title: string
    subtitle: string
    dot: string
    rows: typeof withTasks
  }[] = [
    {
      key: "working",
      title: "Trabajando",
      subtitle: "Con tarea en proceso",
      dot: "bg-emerald-400",
      rows: working,
    },
    {
      key: "assigned",
      title: "Asignados",
      subtitle: "Con tareas pendientes",
      dot: "bg-amber-400",
      rows: withAssigned,
    },
    {
      key: "idle",
      title: "Sin tareas",
      subtitle: "Disponibles",
      dot: "bg-rose-400",
      rows: idle,
    },
  ]

  return (
    <div className="flex w-full flex-col gap-5 pb-4 select-none">
      {sections.map(section => {
        if (section.rows.length === 0) return null
        return (
          <div key={section.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3 px-0.5 pt-1">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", section.dot)}
                />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </span>
                <span className="truncate text-[11px] text-muted-foreground/80">
                  {section.subtitle}
                </span>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/80">
                {section.rows.length}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {section.rows.map(({ user, tasks: assigned }) => {
                const expanded = expandedId === user.id
                const inProgress = assigned.some(t => t.status === "PROGRESS")

                return (
                  <div key={user.id} className="flex flex-col">
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-2xl bg-foreground/5 px-3 py-2.5 transition",
                        expanded && "rounded-b-none bg-foreground/8",
                      )}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        onClick={() =>
                          setExpandedId(expanded ? null : user.id)
                        }
                      >
                        <UserAvatar
                          name={user.name}
                          color={user.color}
                          icon={user.icon}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                              {user.name}
                            </span>
                            {inProgress && (
                              <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                Trabajando
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {assigned.length === 0
                              ? "Sin actividad"
                              : `${assigned.length} ${assigned.length === 1 ? "tarea" : "tareas"}`}
                          </p>
                        </div>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "shrink-0 text-muted-foreground transition-transform",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-lg bg-foreground/5 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                          {assigned.length}
                        </span>
                        {canCreate && onCreateForUser && (
                          <button
                            type="button"
                            onClick={() => onCreateForUser(user.id)}
                            title={`Crear tarea para ${user.name}`}
                            className="flex size-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground transition hover:bg-foreground/10 active:scale-95"
                          >
                            <Plus size={15} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="flex flex-col gap-1.5 rounded-b-2xl border border-t-0 border-border/40 bg-foreground/[0.03] p-2">
                        {assigned.length === 0 ? (
                          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                            Sin tareas asignadas
                          </p>
                        ) : (
                          assigned.map(task => {
                            const def =
                              ENGINEERING_PROCESS_DEFINITIONS[task.processCode]
                            return (
                              <div key={task.id} className="flex flex-col gap-1">
                                {def && (
                                  <span
                                    className="px-1 text-[10px] font-semibold"
                                    style={{ color: def.color }}
                                  >
                                    {def.short} · {def.label}
                                  </span>
                                )}
                                <EngineeringTaskRow
                                  task={task}
                                  onClick={() => onEditTask?.(task)}
                                />
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

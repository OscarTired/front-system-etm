"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { useProjects } from "@/features/projects/hooks/use-projects"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"
import type { Project } from "@/features/projects/types/project.types"

import { useEngineeringTasks } from "../hooks/use-engineering-tasks"
import { useEngineeringViewStore } from "../store/engineering-view-store"
import { EngineeringViewToggle } from "./engineering-view-toggle"
import { EngineeringProcessBoard } from "./engineering-process-board"
import { EngineeringUserList } from "./engineering-user-list"

function EntryCountBadge({
  count,
  compact = false,
}: {
  count: number
  compact?: boolean
}) {
  if (compact) {
    return (
      <div
        className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 px-2 text-xs font-semibold tabular-nums text-muted-foreground"
        title={`${count} ${count === 1 ? "tarea" : "tareas"}`}
      >
        {count}
      </div>
    )
  }

  return (
    <div className="flex h-9 min-w-28 items-center justify-center rounded-xl bg-foreground/5 px-3 text-sm font-medium text-muted-foreground">
      {count} {count === 1 ? "tarea" : "tareas"}
    </div>
  )
}

export function EngineeringPageContent() {
  usePageTitle("Ingeniería")
  const queryClient = useQueryClient()
  const { isMobile } = useResponsive()
  const viewMode = useEngineeringViewStore(s => s.viewMode)

  const { projects } = useProjects()
  const { users } = useUsersDirectory()
  const [projectId, setProjectId] = useState("")

  const filters = useMemo(
    () => (projectId ? { projectId } : {}),
    [projectId],
  )
  const { tasks, loading } = useEngineeringTasks(filters)

  const listUsers = useMemo(
    () => (users as User[]).filter(u => u.active !== false),
    [users],
  )

  const projectList = (projects ?? []) as Project[]
  const fillHeight = viewMode === "processes"

  const toolbar = (
    <div className="w-full shrink-0 rounded-2xl bg-surface p-2 tablet:p-4">
      {/* Mobile: mismo orden mental que Team Bitácora */}
      <div className="flex flex-col gap-2 tablet:hidden">
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className={cn(
            "h-10 w-full rounded-xl bg-foreground/5 px-3 text-sm font-medium text-foreground outline-none",
            "focus:bg-foreground/10",
          )}
        >
          <option value="">Todos los proyectos</option>
          {projectList.map(p => (
            <option key={p.id} value={p.id}>
              {p.projectCode} · {p.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <EngineeringViewToggle compact />
          <div className="min-w-0 flex-1" />
          <EntryCountBadge count={tasks.length} compact />
        </div>
      </div>

      {/* Desktop/tablet: grid 1fr auto 1fr como bitácora equipo */}
      <div className="hidden tablet:grid tablet:grid-cols-[1fr_auto_1fr] tablet:items-center tablet:gap-4">
        <div className="justify-self-start">
          <EngineeringViewToggle />
        </div>

        <div className="justify-self-center">
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className={cn(
              "h-9 min-w-[16rem] max-w-md rounded-xl bg-foreground/5 px-3 text-sm font-medium text-foreground outline-none",
              "focus:bg-foreground/10",
            )}
          >
            <option value="">Todos los proyectos</option>
            {projectList.map(p => (
              <option key={p.id} value={p.id}>
                {p.projectCode} · {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <EntryCountBadge count={tasks.length} />
        </div>
      </div>
    </div>
  )

  const body = (
    <div
      className={
        fillHeight
          ? "flex min-h-0 w-full flex-1 flex-col"
          : "flex w-full flex-col"
      }
    >
      <div className="mb-1 shrink-0">{toolbar}</div>

      {viewMode === "processes" ? (
        <div className="flex min-h-0 flex-1 flex-col max-md:mt-2">
          <EngineeringProcessBoard tasks={tasks} loading={loading} />
        </div>
      ) : (
        <div className="flex w-full flex-col max-md:mt-2">
          <EngineeringUserList
            users={listUsers}
            tasks={tasks}
            loading={loading}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <AppListScroll
        onRefresh={async () => {
          await queryClient.invalidateQueries({
            queryKey: ["engineering-tasks"],
          })
        }}
      >
        {body}
      </AppListScroll>
    </div>
  )
}

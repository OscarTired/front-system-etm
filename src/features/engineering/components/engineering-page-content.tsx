"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"

import { useEngineeringTasks } from "../hooks/use-engineering-tasks"
import { useEngineeringViewStore } from "../store/engineering-view-store"
import { EngineeringViewToggle } from "./engineering-view-toggle"
import { EngineeringProcessBoard } from "./engineering-process-board"
import { EngineeringUserList } from "./engineering-user-list"

export function EngineeringPageContent() {
  usePageTitle("Ingeniería")
  const queryClient = useQueryClient()
  const { isMobile } = useResponsive()
  const viewMode = useEngineeringViewStore(s => s.viewMode)

  const { projects } = useProjects()
  const { users } = useUsersDirectory()
  const [projectId, setProjectId] = useState<string>("")

  const filters = useMemo(
    () => (projectId ? { projectId } : {}),
    [projectId],
  )
  const { tasks, loading } = useEngineeringTasks(filters)

  // Lista: todos los usuarios activos (filtrar por rol ingeniería cuando exista).
  const listUsers = useMemo(
    () => (users as User[]).filter(u => u.active !== false),
    [users],
  )

  const toolbar = (
    <div className="w-full shrink-0 rounded-2xl bg-surface p-2 tablet:p-4">
      <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
        <EngineeringViewToggle compact={isMobile} />

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="h-9 w-full rounded-xl bg-foreground/5 px-3 text-sm text-foreground outline-none tablet:max-w-xs"
        >
          <option value="">Todos los proyectos</option>
          {(projects ?? []).map((p: { id: string; projectCode: string; name: string }) => (
            <option key={p.id} value={p.id}>
              {p.projectCode} · {p.name}
            </option>
          ))}
        </select>
      </div>
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
        <div className="mb-2 shrink-0">{toolbar}</div>
        {viewMode === "processes" ? (
          <EngineeringProcessBoard tasks={tasks} loading={loading} />
        ) : (
          <EngineeringUserList
            users={listUsers}
            tasks={tasks}
            loading={loading}
          />
        )}
      </AppListScroll>
    </div>
  )
}

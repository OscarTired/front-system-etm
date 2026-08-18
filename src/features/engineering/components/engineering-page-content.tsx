"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { AdaptiveActionBar } from "@/shared/responsive/adaptative/adaptive-action-bar"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import {
  TOP_BAR_HEIGHT_PX,
  BOTTOM_NAV_HEIGHT_PX,
} from "@/shared/responsive/layout/chrome-constants"
import { cn } from "@/shared/utils/utils"

import { ContextPicker } from "@/features/tasks/components/context-picker"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import type { User } from "@/features/users/types/user.types"

import { useEngineeringTasks } from "../hooks/use-engineering-tasks"
import { useEngineeringViewStore } from "../store/engineering-view-store"
import { isEngineeringUser } from "../utils/is-engineering-user"
import type { EngineeringProcessCode } from "../constants/engineering-process-definitions"
import type { EngineeringTask } from "../types/engineering-task.types"

import { EngineeringViewToggle } from "./engineering-view-toggle"
import { EngineeringProcessBoard } from "./engineering-process-board"
import { EngineeringUserList } from "./engineering-user-list"
import { EngineeringTaskDialog } from "./engineering-task-dialog"

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
  const queryClient = useQueryClient()
  const { isMobile } = useResponsive()
  const viewMode = useEngineeringViewStore(s => s.viewMode)

  const { users } = useUsersDirectory()
  const [projectId, setProjectId] = useState("")

  // Dialog state (create/edit from board, list, FAB)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<EngineeringTask | null>(null)
  const [defaultProcess, setDefaultProcess] = useState<
    EngineeringProcessCode | undefined
  >()
  const [defaultAssigneeId, setDefaultAssigneeId] = useState<
    string | undefined
  >()
  const [lockProcess, setLockProcess] = useState(false)
  const [lockAssignee, setLockAssignee] = useState(false)

  const filters = useMemo(
    () => (projectId ? { projectId } : {}),
    [projectId],
  )
  const { tasks, loading } = useEngineeringTasks(filters)

  const listUsers = useMemo(
    () => (users as User[]).filter(isEngineeringUser),
    [users],
  )

  const fillHeight = viewMode === "processes"

  function openCreate(opts?: {
    processCode?: EngineeringProcessCode
    assigneeId?: string
  }) {
    setEditingTask(null)
    setDefaultProcess(opts?.processCode)
    setDefaultAssigneeId(opts?.assigneeId)
    setLockProcess(!!opts?.processCode)
    setLockAssignee(!!opts?.assigneeId)
    setDialogOpen(true)
  }

  function openEdit(task: EngineeringTask) {
    setEditingTask(task)
    setDefaultProcess(undefined)
    setDefaultAssigneeId(undefined)
    setLockProcess(false)
    setLockAssignee(false)
    setDialogOpen(true)
  }

  const toolbar = (
    <div className="w-full shrink-0 select-none rounded-2xl bg-surface p-2 tablet:p-4">
      <div className="flex flex-col gap-2 tablet:hidden">
        <ContextPicker
          mode="projects"
          value={{ projectId, taskId: "" }}
          onChange={v => setProjectId(v.projectId)}
        />
        <div className="flex items-center gap-1.5">
          <EngineeringViewToggle compact />
          <div className="min-w-0 flex-1" />
          <EntryCountBadge count={tasks.length} compact />
        </div>
      </div>

      <div className="hidden tablet:grid tablet:grid-cols-[1fr_auto_1fr] tablet:items-center tablet:gap-4">
        <div className="justify-self-start">
          <EngineeringViewToggle />
        </div>
        <div className="justify-self-center">
          <ContextPicker
            mode="projects"
            value={{ projectId, taskId: "" }}
            onChange={v => setProjectId(v.projectId)}
          />
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
          ? "flex min-h-0 w-full flex-1 flex-col select-none"
          : "flex w-full flex-col select-none"
      }
    >
      <div className="mb-1 shrink-0">
        <AdaptiveActionBar
          pinned={toolbar}
          actions={[]}
        />
      </div>

      {viewMode === "processes" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden max-md:mt-2">
          <EngineeringProcessBoard
            tasks={tasks}
            loading={loading}
            onCreateInProcess={code => openCreate({ processCode: code })}
            onEditTask={openEdit}
          />
        </div>
      ) : (
        <div className="flex w-full flex-col max-md:mt-2">
          <EngineeringUserList
            users={listUsers}
            tasks={tasks}
            loading={loading}
            onEditTask={openEdit}
            onCreateForUser={userId => openCreate({ assigneeId: userId })}
          />
        </div>
      )}
    </div>
  )

  // Vista procesos: el board es dueño del scroll (desktop y mobile).
  // AppListScroll rompe el snap horizontal y el alto en mobile.
  const useListScroll = viewMode !== "processes"

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col select-none overflow-hidden">
      {useListScroll ? (
        <AppListScroll
          onRefresh={async () => {
            await queryClient.invalidateQueries({
              queryKey: ["engineering-tasks"],
            })
          }}
        >
          {body}
        </AppListScroll>
      ) : (
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          style={
            isMobile
              ? {
                  paddingTop: TOP_BAR_HEIGHT_PX,
                  paddingBottom: `calc(${BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`,
                }
              : undefined
          }
        >
          {body}
        </div>
      )}

      <EngineeringTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={editingTask}
        defaultProcessCode={defaultProcess}
        defaultProjectId={projectId || undefined}
        defaultAssigneeId={defaultAssigneeId}
        lockProcess={lockProcess}
        lockAssignee={lockAssignee}
      />
    </div>
  )
}

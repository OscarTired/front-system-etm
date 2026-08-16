"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useState } from "react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"

import { AdaptiveActionBar } from "@/shared/responsive/adaptative/adaptive-action-bar"

import { EntityExpandProvider } from "@/shared/ui/entity-table/features/expansion"

import { EntityToolbar } from "@/shared/ui/entity-toolbar/entity-toolbar"
import { EntityToolbarSearch } from "@/shared/ui/entity-toolbar/entity-toolbar-search"

import {
  ExportMenu,
  type ExportScope,
} from "@/shared/export"

import { BackToProjectButton } from "@/features/projects/components/actions/back-to-project-button"

import { TaskTable } from "@/features/tasks/table"

import {
  TaskPipelineBoard,
  TaskViewToggle,
  useTaskView,
  usePipelineTasks,
} from "@/features/tasks/pipeline"

import { FilterBar } from "@/shared/filter/components/filter-bar"

import { TaskSortButton } from "@/shared/sorting/components/task-sort-button"

import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"

import { TaskCreateDialAction } from "@/features/tasks/components/actions/task-actions"
import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"
import { LayoutGrid, Rows3 } from "lucide-react"

import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import { useTasks } from "@/features/tasks/hooks/use-tasks"

import { useTaskExport } from "@/features/reports/hooks/use-task-export"

import { REPORT_EXPORT_SCOPES } from "@/shared/export/constants/export-config"

type Props = {
  focusedTaskId?: string
  focusToken?: string
  initialShowHistory?: boolean
}

export function TaskPageContent({
  focusedTaskId,
  focusToken,
  initialShowHistory = false,
}: Props) {
  const queryClient = useQueryClient()

  const { isMobile } = useResponsive()

  const [search, setSearch] = useState("")
  const [showHistory, setShowHistory] = useState(initialShowHistory)

  const { view, setView, toggleView } = useTaskView()

  const { tasks, loading, reorderTasks } = useTasks()

  const { exporting, exportPdf, exportExcel } = useTaskExport(tasks)

  const {
    boardTasks: pipelineTasks,
    kpiTasks: pipelineKpiTasks,
  } = usePipelineTasks({
    tasks,
    search,
    showHistory,
  })

  const completedCount = tasks.filter(task =>
    isWorkflowCompleted(task.workflowSteps),
  ).length

  async function handleExport(
    format: "pdf" | "excel",
    scope: ExportScope,
  ) {
    if (exporting || tasks.length === 0) return

    if (format === "pdf") {
      await exportPdf(scope)
      return
    }

    await exportExcel(scope)
  }

  const toolbar = (
    <div className="mb-1 shrink-0">
      <EntityToolbar
        left={
          <AdaptiveActionBar
            pinned={
              <>
                <BackToProjectButton />
                <EntityToolbarSearch value={search} onChange={setSearch} />
                {isMobile && (
                  <FilterBar module="tasks" showAddButton={false} />
                )}
              </>
            }
            actions={[
              <FilterBar
                key="filter"
                module="tasks"
                alwaysExpanded={isMobile}
                showChips={!isMobile}
              />,
              <TaskSortButton key="sort" />,
              <HistoryToggleButton
                key="history"
                count={completedCount}
                active={showHistory}
                onClick={() => setShowHistory(v => !v)}
              />,
              <ExportMenu
                key="export"
                scopes={REPORT_EXPORT_SCOPES}
                onExport={handleExport}
              />,
              ...(isMobile
                ? [
                    <FabTrigger
                      key="view"
                      icon={view === "kanban" ? Rows3 : LayoutGrid}
                      label={view === "kanban" ? "CARD" : "KANBAN"}
                      active={view === "kanban"}
                      onClick={toggleView}
                    />,
                    <TaskCreateDialAction key="create" />,
                  ]
                : []),
            ]}
            right={
              !isMobile && (
                <TaskViewToggle value={view} onChange={setView} />
              )
            }
          />
        }
      />
    </div>
  )

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col",
        !isMobile && view === "kanban" ? "overflow-hidden" : "",
      )}
    >
      {view === "card" ? (
        <AppListScroll
          onRefresh={async () => {
            await queryClient.invalidateQueries({ queryKey: ["tasks"] })
          }}
        >
          {toolbar}
          <EntityExpandProvider>
            <TaskTable
              tasks={tasks}
              loading={loading}
              focusedTaskId={focusedTaskId}
              focusToken={focusToken}
              search={search}
              showHistory={showHistory}
              reorderTasks={reorderTasks}
              onHistoryRequired={() => setShowHistory(true)}
            />
          </EntityExpandProvider>
        </AppListScroll>
      ) : isMobile ? (
        <AppListScroll
          onRefresh={async () => {
            await queryClient.invalidateQueries({ queryKey: ["tasks"] })
          }}
        >
          {toolbar}
          <TaskPipelineBoard
            tasks={pipelineTasks}
            kpiTasks={pipelineKpiTasks}
            loading={loading}
          />
        </AppListScroll>
      ) : (
        <>
          {toolbar}
          <div className="min-h-0 flex-1 overflow-hidden">
            <TaskPipelineBoard
              tasks={pipelineTasks}
              kpiTasks={pipelineKpiTasks}
              loading={loading}
            />
          </div>
        </>
      )}
    </div>
  )
}

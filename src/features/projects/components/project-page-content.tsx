"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useMemo, useState } from "react"

import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"

import { AdaptiveActionBar } from "@/shared/responsive/adaptative/adaptive-action-bar"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { ProjectCreateDialAction } from "@/features/projects/components/actions/project-actions"

import { EntityExpandProvider } from "@/shared/ui/entity-table/features/expansion"

import { EntityToolbar } from "@/shared/ui/entity-toolbar/entity-toolbar"
import { EntityToolbarSearch } from "@/shared/ui/entity-toolbar/entity-toolbar-search"

import { FilterBar } from "@/shared/filter/components/filter-bar"

import { ProjectTable } from "@/features/projects/table"

import { HistoryToggleButton } from "@/shared/history/components/history-toggle-button"
import { ProjectSortButton } from "@/shared/sorting/components/project-sort-button"

import { isProjectCompleted } from "@/features/projects/selectors/is-project-completed"

import { useProjects } from "@/features/projects/hooks/use-projects"
import { useTasks } from "@/features/tasks/hooks/use-tasks"

type Props = {
  focusedProjectId?: string
  focusToken?: string
  initialShowHistory?: boolean
}

export function ProjectPageContent({
  focusedProjectId,
  focusToken,
  initialShowHistory = false,
}: Props) {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [showHistory, setShowHistory] = useState(initialShowHistory)

  const { isMobile } = useResponsive()

  const { projects, loading, reorderProjects } = useProjects()
  const { tasks } = useTasks()

  const completedCount = useMemo(
    () => projects.filter(project => isProjectCompleted(project)).length,
    [projects],
  )

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <AppListScroll
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["projects"] })
        }}
      >
        <div className="mb-1">
          <EntityToolbar
            left={
              <AdaptiveActionBar
                pinned={
                  <>
                    <EntityToolbarSearch value={search} onChange={setSearch} />
                    {isMobile && (
                      <FilterBar module="projects" showAddButton={false} />
                    )}
                  </>
                }
                actions={[
                  <FilterBar
                    key="filter"
                    module="projects"
                    alwaysExpanded={isMobile}
                    showChips={!isMobile}
                  />,
                  <ProjectSortButton key="sort" />,
                  <HistoryToggleButton
                    key="history"
                    count={completedCount}
                    active={showHistory}
                    onClick={() => setShowHistory(v => !v)}
                  />,
                  ...(isMobile ? [<ProjectCreateDialAction key="create" />] : []),
                ]}
              />
            }
          />
        </div>

        <EntityExpandProvider>
          <ProjectTable
            projects={projects}
            tasks={tasks}
            loading={loading}
            focusedProjectId={focusedProjectId}
            focusToken={focusToken}
            search={search}
            showHistory={showHistory}
            reorderProjects={reorderProjects}
          />
        </EntityExpandProvider>
      </AppListScroll>
    </div>
  )
}
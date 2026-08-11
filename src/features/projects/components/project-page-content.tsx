"use client"

import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"

import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import { AdaptiveActionBar } from "@/shared/responsive/adaptative/adaptive-action-bar"

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
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const [showHistory, setShowHistory] = useState(initialShowHistory)

  const { projects, loading, reorderProjects } = useProjects()
  const { tasks } = useTasks()

  const completedCount = useMemo(
    () => projects.filter(project => isProjectCompleted(project)).length,
    [projects],
  )

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0">
        <EntityToolbar
          left={
            <AdaptiveActionBar
              pinned={
                <EntityToolbarSearch value={search} onChange={setSearch} />
              }
              actions={[
                <FilterBar key="filter" module="projects" />,
                <ProjectSortButton key="sort" />,
                <HistoryToggleButton
                  key="history"
                  count={completedCount}
                  active={showHistory}
                  onClick={() => setShowHistory(v => !v)}
                />,
              ]}
            />
          }
        />
      </div>

      <VerticalScroll
        resetKey={pathname}
        containerClassName="min-h-0 flex-1"
        className="overflow-x-hidden"
        arrowTopOffset={10}
        arrowBottomOffset={10}
      >
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
      </VerticalScroll>
    </div>
  )
}
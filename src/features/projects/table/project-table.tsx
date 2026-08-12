"use client"

import {
  useEffect,
  useMemo,
} from "react"

import type { Project } from "../types/project.types"
import type { Task } from "@/features/tasks/types/task.types"

import { cn } from "@/shared/utils/utils"

import { useFocusedRow } from "@/shared/hooks/use-focused-row"
import { useExpandRow } from "@/shared/hooks/use-expand-row"
import { useFocusSettleStore } from "@/shared/focus/store/focus-settle-store"

import { useEntityExpand } from "@/shared/ui/entity-table/features/expansion"
import { useRowDragReorder } from "@/shared/dnd/use-row-drag-reorder"

import { ProjectMobileCard } from "./project-mobile-card"
import { ProjectMobileSkeleton } from "./project-mobile-skeleton"

import { useProjectSearch } from "../hooks/use-project-search"

import { useFilterStore } from "@/shared/filter/store/filter-store"
import { filterProjects } from "@/shared/filter/selectors/filter-projects"

import { isProjectCompleted } from "../selectors/is-project-completed"

import { useSortStore } from "@/shared/sorting/store/sort-store"
import { createProjectView } from "@/shared/sorting/engine/sort-engine"

type Props = {
  projects: Project[]
  tasks: Task[]
  loading: boolean
  focusedProjectId?: string
  focusToken?: string
  search: string
  showHistory: boolean
  reorderProjects: (projects: Project[]) => Promise<unknown>
}

export function ProjectTable({
  projects,
  tasks,
  loading,
  focusedProjectId,
  focusToken,
  search,
  showHistory,
  reorderProjects,
}: Props) {
  const expand = useEntityExpand()

  const projectSortMode = useSortStore(
    s => s.projectSortMode,
  )
  const projectSortDirection = useSortStore(
    s => s.projectSortDirection,
  )

  const isManualMode = projectSortMode === "manual"

  const setExpandedRowId = useExpandRow({
    focusedId: focusedProjectId,
    setExpandedRowId: expand.setExpandedRowId,
  })

  const markSettled = useFocusSettleStore(s => s.markSettled)
  const blurUntil = useFocusSettleStore(s => s.blurUntil)
  const pendingToken = useFocusSettleStore(s => s.pendingToken)
  const settledToken = useFocusSettleStore(s => s.settledToken)
  void blurUntil
  void pendingToken
  void settledToken
  const isSettlingFocus = useFocusSettleStore(s => s.isSettling(focusToken))

  useFocusedRow({
    focusedId: focusedProjectId,
    expandedRowId: expand.expandedRowId,
    setExpandedRowId: expand.setExpandedRowId,
    focusToken,
    onSettled: () => {
      if (focusToken) markSettled(focusToken)
    },
  })

  const filteredProjects = useProjectSearch(projects, search)

  const filters = useFilterStore(
    s => s.filters.projects,
  )

  const visibleProjects = filterProjects({
    projects: filteredProjects,
    filters,
  })

  const sortedProjects = useMemo(
    () => createProjectView({
      base: visibleProjects,
      mode: projectSortMode,
      direction: projectSortDirection,
    }),
    [visibleProjects, projectSortMode, projectSortDirection],
  )

  const completed = sortedProjects.filter(
    p => isProjectCompleted(p),
  )

  const active = sortedProjects.filter(
    p => !isProjectCompleted(p),
  )

  const displayedProjects = showHistory
    ? [...completed, ...active]
    : active

  useEffect(() => {
    if (!expand.expandedRowId) {
      return
    }

    const exists = displayedProjects.some(
      project => project.id === expand.expandedRowId,
    )

    if (!exists) {
      expand.setExpandedRowId(null)
    }
  }, [
    displayedProjects,
    expand.expandedRowId,
    expand.setExpandedRowId,
  ])

  const dragApi = useRowDragReorder({
    items: displayedProjects,
    getId: p => p.id,
    disabled: !isManualMode,
    isRowDisabled: project => expand.expandedRowId === project.id,
    onReorder: next => {
      reorderProjects(next)
    },
    renderDragLabel: project => (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/50">
            {project.projectCode}
          </span>
        </div>
        <div className="mt-1 truncate text-sm font-semibold text-white">
          {project.name}
        </div>
        <div className="mt-0.5 text-[11px] text-white/40">
          {String(project.sequence).padStart(3, "0")}
        </div>
      </div>
    ),
  })

  if (loading) {
    return <ProjectMobileSkeleton />
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-2 pb-2 transition-[filter] duration-200 ease-out",
          isSettlingFocus && "pointer-events-none blur-[3px] opacity-55",
        )}
      >
        {displayedProjects.map(project => {
          const card = (
            <ProjectMobileCard
              project={project}
              tasks={tasks}
              expanded={expand.expandedRowId === project.id}
              onToggle={() =>
                setExpandedRowId(
                  expand.expandedRowId === project.id
                    ? null
                    : project.id,
                )
              }
            />
          )

          return (
            <div key={project.id} data-expanded-row-id={project.id}>
              {/* templateColumns vacío porque la card maneja su
                  propio layout, no un grid de columnas. */}
              {dragApi.renderRow(project, card, "", project.id)}
            </div>
          )
        })}

        {displayedProjects.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl bg-white/2 text-sm text-neutral-500">
            Sin proyectos
          </div>
        )}
      </div>

      {isManualMode && dragApi.overlay}
    </>
  )
}
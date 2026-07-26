"use client"

import { useEffect, useMemo } from "react"

import { useFocusedRow } from "@/shared/hooks/use-focused-row"
import { useHistoryHiddenFocus } from "@/shared/hooks/use-history-hidden-focus"

import { useEntityExpand } from "@/shared/ui/entity-table/features/expansion"

import { ProcessMobileCard } from "./process-mobile-card"
import { ProcessCardSkeleton } from "./process-card-skeleton"

import { processAccess } from "../access/process-access"

import { useFilterStore } from "@/shared/filter/store/filter-store"
import { filterProcess } from "@/shared/filter/selectors/filter-process"

import { useProcessSearch } from "../hooks/use-process-search"

import { useSortStore } from "@/shared/sorting/store/sort-store"
import { createTaskView } from "@/shared/sorting/engine/sort-engine"

import type {
  ProcessDefinition,
  ProcessTask,
} from "../types/process.types"

type Props = {
  processDefinition: ProcessDefinition
  processTasks: ProcessTask[]
  search: string
  loading: boolean
  focusedTaskId?: string
  focusToken?: string
  showHistory: boolean
  onHistoryRequired?: () => void
  onResolvingChange?: (resolving: boolean) => void
}

// Vista CARD de Procesos (solo desktop — en mobile ProcessTable
// sigue forzando su propio TaskProcessColumn, sin tocar). Misma
// fuente de datos/filtros/orden que ProcessTable (TABLA); la única
// diferencia real es la fila: ProcessMobileCard en vez de
// EntityTable + buildProcessColumns. No hay drag reorder acá — el
// orden de Procesos lo da el workflow, no el usuario (igual que en
// TABLA).
export function ProcessTableCard({
  processDefinition,
  processTasks,
  search,
  loading,
  focusedTaskId,
  focusToken,
  showHistory,
  onHistoryRequired,
  onResolvingChange,
}: Props) {

  const expand = useEntityExpand()

  const taskSortMode = useSortStore(
    s => s.taskSortMode,
  )

  useFocusedRow({
    focusedId: focusedTaskId,
    setExpandedRowId: expand.setExpandedRowId,
    focusToken,
  })

  const filteredTasks = useProcessSearch(processTasks, search)

  const processFilters = useFilterStore(
    state => state.filters.processes,
  )

  const visibleTasks = useMemo(
    () => filterProcess({
      processTasks: filteredTasks,
      filters: processFilters,
    }),
    [filteredTasks, processFilters],
  )

  const orderedTasks = useMemo(
    () => createTaskView({
      base: visibleTasks,
      mode: taskSortMode,
      getTask: processTask => processTask.task,
    }),
    [visibleTasks, taskSortMode],
  )

  const completedTasks = useMemo(
    () => orderedTasks.filter(
      task => task.workflowStep?.status === "REVIEWED",
    ),
    [orderedTasks],
  )

  const activeTasks = useMemo(
    () => orderedTasks.filter(
      task => task.workflowStep?.status !== "REVIEWED",
    ),
    [orderedTasks],
  )

  const displayedTasks = useMemo(
    () => showHistory
      ? [...completedTasks, ...activeTasks]
      : activeTasks,
    [showHistory, completedTasks, activeTasks],
  )

  useEffect(() => {

    if (!expand.expandedRowId) {
      return
    }

    const existsAnywhere = orderedTasks.some(
      processTask => processAccess.task(processTask).id === expand.expandedRowId,
    )

    if (!existsAnywhere) {
      expand.setExpandedRowId(null)
    }

  }, [
    orderedTasks,
    expand.expandedRowId,
    expand.setExpandedRowId,
  ])

  useHistoryHiddenFocus({
    focusedId: focusedTaskId,
    focusToken,
    showHistory,
    visibleItems: displayedTasks,
    allItems: orderedTasks,
    getId: processTask => processAccess.task(processTask).id,
    onHistoryRequired,
    onResolvingChange,
  })

  if (loading) {
    return <ProcessCardSkeleton />
  }

  return (

    <div className="flex flex-col gap-2 pb-2">

      {displayedTasks.map(processTask => {

        const id = processAccess.task(processTask).id

        return (

          <div key={id} data-expanded-row-id={id}>

            <ProcessMobileCard
              processTask={processTask}
              expanded={expand.expandedRowId === id}
              onToggle={() =>
                expand.setExpandedRowId(
                  expand.expandedRowId === id
                    ? null
                    : id,
                )
              }
            />

          </div>

        )

      })}

      {displayedTasks.length === 0 && (

        <div className="flex h-24 items-center justify-center rounded-xl bg-white/2 text-sm text-neutral-500">
          Sin tareas en {processDefinition.label}
        </div>

      )}

    </div>

  )
}
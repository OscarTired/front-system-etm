"use client"

import {
  useEffect,
  useMemo,
} from "react"

import type { Task } from "../types/task.types"

import { useFocusedRow } from "@/shared/hooks/use-focused-row"
import { useExpandRow } from "@/shared/hooks/use-expand-row"
import { useHistoryHiddenFocus } from "@/shared/hooks/use-history-hidden-focus"
import { useFocusSettleStore } from "@/shared/focus/store/focus-settle-store"

import { useEntityExpand } from "@/shared/ui/entity-table/features/expansion"
import { useRowDragReorder } from "@/shared/dnd/use-row-drag-reorder"

import { TaskMobileCard } from "./task-mobile-card"
import { TaskMobileSkeleton } from "./task-mobile-skeleton"

import { useTaskSearch } from "../hooks/use-task-search"

import { useFilterStore } from "@/shared/filter/store/filter-store"
import { filterTasks } from "@/shared/filter/selectors/filter-tasks"

import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import { useSortStore } from "@/shared/sorting/store/sort-store"
import { createTaskView } from "@/shared/sorting/engine/sort-engine"

type Props = {
  tasks: Task[]
  loading: boolean
  focusedTaskId?: string
  focusToken?: string
  search: string
  showHistory: boolean
  reorderTasks: (tasks: Task[]) => Promise<unknown>
  onHistoryRequired?: () => void
}

export function TaskTable({
  tasks,
  loading,
  focusedTaskId,
  focusToken,
  search,
  showHistory,
  reorderTasks,
  onHistoryRequired,
}: Props) {

  const expand = useEntityExpand()

  const taskSortMode = useSortStore(
    s => s.taskSortMode,
  )
  const taskSortDirection = useSortStore(
    s => s.taskSortDirection,
  )

  const isManualMode = taskSortMode === "manual"

  const setExpandedRowId = useExpandRow({
    focusedId: focusedTaskId,
    setExpandedRowId: expand.setExpandedRowId,
  })

  const markSettled = useFocusSettleStore(s => s.markSettled)

  useFocusedRow({
    focusedId: focusedTaskId,
    expandedRowId: expand.expandedRowId,
    setExpandedRowId: expand.setExpandedRowId,
    focusToken,
    onSettled: () => {
      if (focusToken) markSettled(focusToken)
    },
  })

  const filteredTasks = useTaskSearch(tasks, search)

  const filters = useFilterStore(
    s => s.filters.tasks,
  )

  const visibleTasks = filterTasks({
    tasks: filteredTasks,
    filters,
  })

  const sortedTasks = useMemo(
    () => createTaskView({
      base: visibleTasks,
      mode: taskSortMode,
      direction: taskSortDirection,
    }),
    [visibleTasks, taskSortMode, taskSortDirection],
  )

  const completed = sortedTasks.filter(
    task => isWorkflowCompleted(task.workflowSteps),
  )

  const active = sortedTasks.filter(
    task => !isWorkflowCompleted(task.workflowSteps),
  )

  const displayedTasks = showHistory
    ? [...completed, ...active]
    : active

  useEffect(() => {

    if (!expand.expandedRowId) {
      return
    }

    const exists = displayedTasks.some(
      task => task.id === expand.expandedRowId,
    )

    if (!exists) {
      expand.setExpandedRowId(null)
    }

  }, [
    displayedTasks,
    expand.expandedRowId,
    expand.setExpandedRowId,
  ])

  // Red de seguridad silenciosa: si la tarea focused no está visible
  // (por ej. el Bell no tenía cache de ["tasks"] para decidir antes
  // de navegar), auto-activa showHistory sin preguntar nada.
  useHistoryHiddenFocus({
    focusedId: focusedTaskId,
    focusToken,
    showHistory,
    visibleItems: displayedTasks,
    allItems: sortedTasks,
    getId: task => task.id,
    onHistoryRequired,
  })

  const dragApi = useRowDragReorder({
    items: displayedTasks,
    getId: t => t.id,
    disabled: !isManualMode,
    isRowDisabled: task => expand.expandedRowId === task.id,
    onReorder: next => {
      reorderTasks(next)
    },
    renderDragLabel: task => (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/50">
            {String(task.taskNumber).padStart(3, "0")}
          </span>
          <span className="text-[11px] font-medium tracking-wide text-white/50">
            {task.project.projectCode}
          </span>
        </div>
        <div className="mt-1 truncate text-sm font-semibold text-white">
          {task.reference}
        </div>
      </div>
    ),
  })

  if (loading) {
    return <TaskMobileSkeleton />
  }

  return (

    <>

      <div className="flex flex-col gap-2 pb-2">

        {displayedTasks.map(task => {

          const card = (

            <TaskMobileCard
              task={task}
              expanded={expand.expandedRowId === task.id}
              onToggle={() =>
                setExpandedRowId(
                  expand.expandedRowId === task.id
                    ? null
                    : task.id,
                )
              }
            />

          )

          return (

            // data-expanded-row-id: es lo que useFocusedRow busca
            // para hacer scrollIntoView cuando se navega acá con un
            // taskId puntual (ej. desde una notificación) — el modo
            // tabla real (EntityTable) ya lo tenía, esto le faltaba
            // al modo card para tener el mismo comportamiento.
            <div key={task.id} data-expanded-row-id={task.id}>

              {/* templateColumns vacío porque la card maneja su
                  propio layout, no un grid de columnas. */}
              {dragApi.renderRow(task, card, "", task.id)}

            </div>

          )

        })}

        {displayedTasks.length === 0 && (

          <div className="flex h-24 items-center justify-center rounded-xl bg-white/2 text-sm text-neutral-500">
            Sin tareas
          </div>

        )}

      </div>

      {isManualMode && dragApi.overlay}

    </>

  )
}
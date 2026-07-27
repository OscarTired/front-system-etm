"use client"

import { useEffect, useMemo, useState } from "react"

import { useFocusedRow } from "@/shared/hooks/use-focused-row"
import { useHistoryHiddenFocus } from "@/shared/hooks/use-history-hidden-focus"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { useEntityExpand } from "@/shared/ui/entity-table/features/expansion"

import { TaskProcessColumn } from "@/features/tasks/pipeline/table/task-process-column"

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

// Vista CARD de Procesos — la única vista que queda (se borró la
// vista tabla). En desktop es ProcessMobileCard (fila con acciones
// siempre visibles). En mobile se restauró lo que ya existía antes
// de unificar todo: TaskProcessColumn, la misma kanban card que usa
// el tablero de Tareas — se había perdido sin querer al borrar
// process-table.tsx (la vista TABLA), que era donde vivía esta
// rama mobile.
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

  const { isMobile } = useResponsive()

  const expand = useEntityExpand()

  // Estado del pipeline mobile — esta página es standalone (no vive
  // dentro de TaskPipelineBoard), así que necesita su propio lock de
  // overlay Y su propia clave de expansión, con el formato
  // "taskId:processCode" que espera TaskProcessColumn — NO se puede
  // reusar expand.expandedRowId acá porque ese es solo el taskId
  // (formato de ProcessMobileCard/EntityTable, pensado para
  // desktop), nunca matchea.
  const [mobileExpandedKey, setMobileExpandedKey] =
    useState<string | null>(null)

  const [activeOverlayKey, setActiveOverlayKey] =
    useState<string | null>(null)

  const handleOverlayOpenChange = (key: string, isOpen: boolean) => {
    setActiveOverlayKey(isOpen ? key : null)
  }

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

  // Si llega un foco a una tarea específica (ej. desde una
  // notificación) mientras estamos en mobile, expandirla
  // automáticamente con la clave en el formato correcto.
  useEffect(() => {

    if (!isMobile || !focusedTaskId) {
      return
    }

    const exists = displayedTasks.some(
      pt => pt.task.id === focusedTaskId,
    )

    if (exists) {
      setMobileExpandedKey(`${focusedTaskId}:${processDefinition.code}`)
    }

  }, [isMobile, focusedTaskId, displayedTasks, processDefinition.code])

  if (loading) {
    return <ProcessCardSkeleton />
  }

  if (isMobile) {

    const tasks = displayedTasks.map(
      processTask => processTask.task,
    )

    return (

      <TaskProcessColumn
        processCode={processDefinition.code}
        tasks={tasks}
        expandedKey={mobileExpandedKey}
        onToggleCard={(key) =>
          setMobileExpandedKey(current =>
            current === key ? null : key,
          )
        }
        activeOverlayKey={activeOverlayKey}
        onOverlayOpenChange={handleOverlayOpenChange}
        contentOnly
      />

    )

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
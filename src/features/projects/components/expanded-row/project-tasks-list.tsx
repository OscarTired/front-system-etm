"use client"

import { useMemo, useState } from "react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import type { Task } from "@/features/tasks/types/task.types"

import { HorizontalScroll } from "@/shared/ui/horizontal-scroll/horizontal-scroll"

import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import { ProjectTaskRow } from "./project-task-row"
import { ProjectTaskPlaceholder } from "./project-task-placeholder"
import { ProjectCompletedTasksCard } from "./project-completed-tasks-card"

import { TaskDialog } from "@/features/tasks/components/dialog/task-dialog"

type Props = {
  projectId: string
  tasks: Task[]
}

const PRIORITY_ORDER: Record<string, number> = {
  URGENTE: 0,
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
}

const UNKNOWN_PRIORITY_ORDER = Number.MAX_SAFE_INTEGER

function getPriorityOrder(code: string): number {

  return code in PRIORITY_ORDER
    ? PRIORITY_ORDER[code]
    : UNKNOWN_PRIORITY_ORDER

}

export function ProjectTasksList({
  projectId,
  tasks,
}: Props) {

  const { isMobile } = useResponsive()

  const [
    openTaskDialog,
    setOpenTaskDialog,
  ] = useState(false)

  const [
    showCompleted,
    setShowCompleted,
  ] = useState(false)

  // Solo una tarea abierta a la vez entre todas las de este
  // proyecto en mobile — antes cada ProjectTaskRow manejaba su
  // propio expanded local, así que podían quedar 2+ abiertas al
  // mismo tiempo. En desktop no hace falta (las cards siempre
  // muestran todo, ProjectTaskRow ni usa expanded ahí de verdad).
  const [
    expandedTaskId,
    setExpandedTaskId,
  ] = useState<string | null>(null)

  const projectTasks = useMemo(
    () => tasks.filter(
      task => task.project.id === projectId,
    ),
    [
      tasks,
      projectId,
    ],
  )

  const sortedTasks = useMemo(
    () => [...projectTasks].sort((a, b) => {

      const priorityDiff =
        getPriorityOrder(a.priority.code) -
        getPriorityOrder(b.priority.code)

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      const aDate = a.deliveryDate
        ? new Date(a.deliveryDate).getTime()
        : Number.MAX_SAFE_INTEGER

      const bDate = b.deliveryDate
        ? new Date(b.deliveryDate).getTime()
        : Number.MAX_SAFE_INTEGER

      return aDate - bDate

    }),
    [
      projectTasks,
    ],
  )

  const activeTasks = sortedTasks.filter(
    task => !isWorkflowCompleted(
      task.workflowSteps,
    ),
  )

  const completedTasks = sortedTasks.filter(
    task => isWorkflowCompleted(
      task.workflowSteps,
    ),
  )

  const visibleTasks = showCompleted
    ? [
        ...completedTasks,
        ...activeTasks,
      ]
    : activeTasks

  if (isMobile) {

    return (

      <div className="flex flex-col gap-2">

        {/* Nueva tarea: el + vive en el row del project (mobile). */}

        {completedTasks.length > 0 && (

          <ProjectCompletedTasksCard
            completedCount={completedTasks.length}
            expanded={showCompleted}
            onClick={() =>
              setShowCompleted(v => !v)
            }
          />

        )}

        {visibleTasks.map(task => (

          <div
            key={task.id}
            className={
              isWorkflowCompleted(task.workflowSteps)
                ? "opacity-75"
                : undefined
            }
          >

            <ProjectTaskRow
              task={task}
              expanded={expandedTaskId === task.id}
              onToggle={() =>
                setExpandedTaskId(current =>
                  current === task.id ? null : task.id,
                )
              }
            />

          </div>

        ))}

        {openTaskDialog && (

          <TaskDialog
            open
            projectId={projectId}
            promptOpenAfterCreate
            onClose={() =>
              setOpenTaskDialog(false)
            }
          />

        )}

      </div>

    )

  }

  return (

    <div>

      <HorizontalScroll>

        <div className="w-72 shrink-0">

          <ProjectTaskPlaceholder
            onClick={() =>
              setOpenTaskDialog(true)
            }
          />

        </div>

        {completedTasks.length > 0 && (

          <div className="w-72 shrink-0">

            <ProjectCompletedTasksCard
              completedCount={completedTasks.length}
              expanded={showCompleted}
              onClick={() =>
                setShowCompleted(v => !v)
              }
            />

          </div>

        )}

        {visibleTasks.map(task => (

          <div
            key={task.id}
            className={
              isWorkflowCompleted(task.workflowSteps)
                ? "w-72 shrink-0 opacity-75"
                : "w-72 shrink-0"
            }
          >

            <ProjectTaskRow
              task={task}
            />

          </div>

        ))}

      </HorizontalScroll>

      {openTaskDialog && (

        <TaskDialog
          open
          projectId={projectId}
          promptOpenAfterCreate
          onClose={() =>
            setOpenTaskDialog(false)
          }
        />

      )}

    </div>

  )

}
"use client"

import {
  useCallback,
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  ChevronRight,
} from "lucide-react"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  cn,
} from "@/shared/utils/utils"

import {
  KanbanCardView,
} from "@/features/tasks/components/kanban-card/kanban-card-view"

import {
  KanbanCardFromTask,
} from "@/features/tasks/components/kanban-card/kanban-card-from-task"

import {
  TaskPipelineCardCompact,
} from "@/features/tasks/pipeline/components/cards/task-pipeline-card-compact"

import {
  useTaskCardOverlay,
} from "@/features/tasks/pipeline/hooks/use-task-card-overlay"

import type {
  ProcessCode,
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import type {
  ProcessTask,
} from "@/features/processes/types/process.types"

import {
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  WORKFLOW_STATUS_DEFINITIONS,
} from "@/features/workflow/constants/workflow-status-definitions"

import {
  getCurrentStep,
} from "@/features/workflow/selectors/get-current-step"

import {
  isWorkflowCompleted,
} from "@/features/workflow/selectors/is-completed"

import {
  ProjectTaskActionsOverlay,
} from "./project-task-actions-overlay"

type Props = {
  task: Task
  // Opcionales: si el padre los pasa (ProjectTasksList en mobile,
  // para que solo una tarea esté abierta a la vez entre todas las
  // de un mismo proyecto), se usan esos. Si no, cae al estado local
  // de siempre — así el uso en desktop (que ni siquiera usa
  // `expanded` de verdad, ver "isMobile ? expanded : true" abajo)
  // sigue funcionando sin tener que pasar nada.
  expanded?: boolean
  onToggle?: () => void
}

type StageEntity = EntityBase & {
  code?: string
}

export function ProjectTaskRow({
  task,
  expanded: expandedProp,
  onToggle,
}: Props) {
  const router =
    useRouter()

  const {
    isMobile,
  } =
    useResponsive()

  const [
    localExpanded,
    setLocalExpanded,
  ] =
    useState(false)

  const expanded = expandedProp ?? localExpanded

  const toggleExpanded = useCallback(
    () => {
      if (onToggle) {
        onToggle()
      } else {
        setLocalExpanded(current => !current)
      }
    },
    [onToggle],
  )

  const {
    stage,
    status,
  } =
    useMemo(() => {
      const currentStep =
        getCurrentStep(
          task.workflowSteps,
        )

      const stage:
        | StageEntity
        | undefined =
        isWorkflowCompleted(
          task.workflowSteps,
        )
          ? {
              id: "finalized",
              name: "Finalizada",
              icon: "check",
              color: "#22C55E",
            }
          : currentStep
            ? {
                id: currentStep.processCode,
                name:
                  PROCESS_DEFINITIONS[
                    currentStep.processCode
                  ].label,
                code:
                  PROCESS_DEFINITIONS[
                    currentStep.processCode
                  ].code,
                icon:
                  PROCESS_DEFINITIONS[
                    currentStep.processCode
                  ].icon,
                color:
                  PROCESS_DEFINITIONS[
                    currentStep.processCode
                  ].color,
              }
            : undefined

      const status:
        | EntityBase
        | undefined =
        isWorkflowCompleted(
          task.workflowSteps,
        )
          ? {
              id: "finalized",
              name: "Finalizado",
              icon: "check",
              color: "#22C55E",
            }
          : currentStep
            ? {
                id: currentStep.status,
                name:
                  WORKFLOW_STATUS_DEFINITIONS[
                    currentStep.status
                  ].label,
                icon:
                  WORKFLOW_STATUS_DEFINITIONS[
                    currentStep.status
                  ].icon,
                color:
                  WORKFLOW_STATUS_DEFINITIONS[
                    currentStep.status
                  ].color,
              }
            : undefined

      return {
        stage,
        status,
      }
    }, [
      task.workflowSteps,
    ])

  const processTask:
    ProcessTask =
    useMemo(() => {
      const workflowStep =
        isWorkflowCompleted(
          task.workflowSteps,
        )
          ? task.workflowSteps[
              task.workflowSteps.length - 1
            ] ?? null
          : getCurrentStep(
              task.workflowSteps,
            )

      return {
        task,
        workflowStep,
        paintStep: null,
        inputQuantity: null,
      }
    }, [
      task,
    ])

  const activeProcessCode:
    | ProcessCode
    | undefined =
    useMemo(() => {
      if (
        isWorkflowCompleted(
          task.workflowSteps,
        )
      ) {
        return task.workflowSteps[
          task.workflowSteps.length - 1
        ]?.processCode
      }

      return getCurrentStep(
        task.workflowSteps,
      )?.processCode
    }, [
      task.workflowSteps,
    ])

  // En mobile sigue exigiendo estar expandida primero (comportamiento
  // sin cambios). En desktop no hay ese paso de "expandir" — el
  // long-press queda siempre habilitado directo sobre KanbanCardView.
  const longPressEnabled =
    isMobile ? expanded : true

  const {
    bind,
    pressed,
    overlayOpen,
    closeOverlay,
  } =
    useTaskCardOverlay({
      enabled: longPressEnabled,
    })

  const handleNavigate =
    useCallback(
      (
        event: React.MouseEvent,
      ) => {
        event.stopPropagation()

        sessionStorage.setItem(
          "task-origin-project-id",
          task.project.id,
        )

        router.push(`/tasks?taskId=${encodeURIComponent(task.id)}`)
      },
      [
        router,
        task.project.id,
        task.id,
      ],
    )

  const handleCardClick =
    useCallback(
      (
        event: React.MouseEvent,
      ) => {
        if (isMobile) {
          if (!overlayOpen) {
            toggleExpanded()
          }

          return
        }

        // El long-press ya abrió el overlay — el mouseup que sigue
        // no debería además disparar la navegación normal del
        // click.
        if (overlayOpen) {
          return
        }

        handleNavigate(event)
      },
      [
        isMobile,
        overlayOpen,
        handleNavigate,
      ],
    )

  // Mismo criterio que ya usa TaskPipelineCard en el Kanban de
  // Tareas: una tarea finalizada, mostrada solo porque el historial
  // está activo, se ve atenuada — para distinguirla de un vistazo de
  // las que siguen activas.
  const isDimmed =
    isWorkflowCompleted(
      task.workflowSteps,
    )

  return (
    <div
      {...(
        longPressEnabled
          ? bind
          : {}
      )}
      onClick={handleCardClick}
      className="group relative cursor-pointer"
    >
      {isMobile ? (
        expanded &&
        activeProcessCode ? (
          <div key="expanded" className="animate-comment-in">
            <div
              className={cn(
                "overflow-hidden rounded-xl transition-all duration-200",
                pressed &&
                  !overlayOpen &&
                  "scale-[0.98] shadow-lg",
                isDimmed &&
                  "opacity-50",
              )}
            >
              <KanbanCardFromTask
                task={task}
                processCode={
                  activeProcessCode
                }
              />
            </div>
          </div>
        ) : (
          <div
            key="compact"
            className={cn(
              "animate-comment-in",
              isDimmed && "opacity-50",
            )}
          >
            <TaskPipelineCardCompact
              processTask={processTask}
              reserveActionsSpace
            />
          </div>
        )
      ) : (
        <div
          className={cn(
            "overflow-hidden rounded-xl",
            isDimmed && "opacity-50",
          )}
        >
          <KanbanCardView
          priorityName={
            task.priority.name
          }
          priorityColor={
            task.priority.color
          }
          deliveryDate={
            task.deliveryDate
          }
          reference={task.reference}
          lotNumber={task.lotNumber}
          materialName={
            task.material.name
          }
          thicknessName={
            task.thickness.name
          }
          pieces={task.pieces}
          colorName={
            task.color?.name
          }
          colorHex={
            task.color?.color
          }
          stageName={stage?.name}
          stageCode={stage?.code}
          stageColor={stage?.color}
          stageIcon={stage?.icon}
          statusName={status?.name}
          statusColor={status?.color}
          statusIcon={status?.icon}
          taskNumber={task.taskNumber}
          />
        </div>
      )}

      {(isMobile ? expanded : true) && (
        <ProjectTaskActionsOverlay
          task={task}
          visible={overlayOpen}
          onClose={closeOverlay}
        />
      )}

      {!overlayOpen && (
        <button
          type="button"
          onClick={handleNavigate}
          aria-label="Abrir tarea"
          className={cn(
            "absolute right-2 top-1/2 z-20 -translate-y-1/2",
            "flex h-8 w-8 items-center justify-center rounded-xl",
            "bg-white/4",
            "text-white/40",
            "transition duration-200",
            "hover:bg-white/[0.07] hover:text-white hover:scale-105",
            "active:scale-95",
            "shadow-[0_2px_8px_rgba(0,0,0,0.28)]",
            isMobile
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
          )}
        >
          <ChevronRight
            size={16}
            strokeWidth={2.5}
          />
        </button>
      )}
    </div>
  )
}
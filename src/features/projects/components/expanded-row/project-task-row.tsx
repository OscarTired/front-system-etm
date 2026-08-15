"use client"

import {
  useCallback,
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"
import { useFocusNavStore } from "@/shared/focus/store/focus-nav-store"

import {
  ChevronRight,
  MessageSquare,
} from "lucide-react"

import { EntityAuditInfo } from "@/shared/ui/entity-audit-info/entity-audit-info"
import { TaskMaterialInfo } from "@/features/tasks/components/task-material-info"
import { CHROME_ICON_BTN } from "@/shared/ui/actions/icon-action"
import { CommentHistoryDialog } from "@/features/comments/components/comment-history-dialog"

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

  const [commentsOpen, setCommentsOpen] = useState(false)

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

        useFocusNavStore.getState().start("Abriendo tarea…")
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
          <div
            key="expanded"
            className={cn(!isDimmed && "animate-comment-in")}
          >
            <div
              className={cn(
                "overflow-hidden rounded-xl transition-all duration-200",
                pressed &&
                  !overlayOpen &&
                  "scale-[0.98] shadow-sm shadow-black/15 dark:shadow-black/40",
                // Opacidad final de entrada — sin animar 0→1 (evita flash claro)
                isDimmed && "opacity-50",
              )}
            >
              <KanbanCardFromTask
                task={task}
                processCode={
                  activeProcessCode
                }

                footerActions={
                  <div
                    className="flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <EntityAuditInfo
                      createdAt={task.createdAt}
                      updatedAt={task.updatedAt}
                      createdBy={task.createdBy}
                      updatedBy={task.updatedBy}
                    />
                    <TaskMaterialInfo task={task} />
                    {processTask?.workflowStep && (
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          setCommentsOpen(true)
                        }}
                        title={
                          (processTask.workflowStep?.commentCount ?? 0) > 0
                            ? `${processTask.workflowStep?.commentCount} mensajes`
                            : "Mensajes"
                        }
                        aria-label="Mensajes"
                        className={cn(CHROME_ICON_BTN, "relative")}
                      >
                        <MessageSquare size={14} strokeWidth={2.25} />
                        {(processTask.workflowStep?.commentCount ?? 0) > 0 && (
                          <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold tabular-nums text-primary-foreground">
                            {(processTask.workflowStep?.commentCount ?? 0) > 9
                              ? "9+"
                              : processTask.workflowStep?.commentCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                }

              />
            </div>
          </div>
        ) : (
          <div
            key="compact"
            className={cn(
              // Completadas: opacas desde el primer frame (sin comment-in a opacity 1)
              !isDimmed && "animate-comment-in",
              isDimmed && "opacity-50",
            )}
          >
            <TaskPipelineCardCompact
              processTask={processTask}
              reserveActionsSpace={isMobile}
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
          <KanbanCardFromTask
            task={task}
            processCode={activeProcessCode}
            footerActions={
              <div
                className="flex items-center gap-1"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <EntityAuditInfo
                  createdAt={task.createdAt}
                  updatedAt={task.updatedAt}
                  createdBy={task.createdBy}
                  updatedBy={task.updatedBy}
                />
                <TaskMaterialInfo task={task} />
                {processTask.workflowStep && (
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation()
                      setCommentsOpen(true)
                    }}
                    title={
                      (processTask.workflowStep?.commentCount ?? 0) > 0
                        ? `${processTask.workflowStep?.commentCount} mensajes`
                        : "Mensajes"
                    }
                    aria-label="Mensajes"
                    className={cn(CHROME_ICON_BTN, "relative")}
                  >
                    <MessageSquare size={14} strokeWidth={2.25} />
                    {(processTask.workflowStep?.commentCount ?? 0) > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold tabular-nums text-primary-foreground">
                        {(processTask.workflowStep?.commentCount ?? 0) > 9
                          ? "9+"
                          : processTask.workflowStep?.commentCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            }
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

      {/* Desktop: la card entera / click navega; flecha solo en móvil */}
      {processTask.workflowStep && (
        <CommentHistoryDialog
          target={{
            scope: "workflowStep",
            workflowStepId: processTask.workflowStep.id,
          }}
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          readOnly={isWorkflowCompleted(task.workflowSteps)}
        />
      )}

      {!overlayOpen && isMobile && (
        <button
          type="button"
          onClick={handleNavigate}
          aria-label="Abrir tarea"
          className={cn(
            "absolute right-2 top-1/2 z-20 -translate-y-1/2",
            "flex h-8 w-8 items-center justify-center rounded-xl",
            "bg-foreground/5",
            "text-foreground/40",
            "transition duration-200",
            "hover:bg-foreground/[0.07] hover:text-foreground hover:scale-105",
            "active:scale-95",
            "shadow-sm shadow-black/15 dark:shadow-black/40",
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
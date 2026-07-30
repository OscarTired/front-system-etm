"use client"

import {
  useCallback,
  useMemo,
  useState,
} from "react"

import {
  MessageCircle,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  KanbanCardFromTask,
} from "@/features/tasks/components/kanban-card/kanban-card-from-task"

import {
  CommentHistoryDialog,
} from "@/features/comments/components/comment-history-dialog"

import type {
  ProcessCode,
  Task,
} from "@/features/tasks/types/task.types"

import {
  isWorkflowCompleted,
} from "@/features/workflow/selectors/is-completed"

import {
  getProcessTask,
} from "../../utils/get-process-task"

import {
  useTaskCardOverlay,
} from "../../hooks/use-task-card-overlay"

import {
  TaskPipelineCardCompact,
} from "./task-pipeline-card-compact"

import {
  TaskWorkflowOverlay,
} from "../tasks/task-workflow-overlay"

type Props = {
  task: Task
  processCode: ProcessCode
  expanded: boolean
  onToggle: () => void
  overlayLocked: boolean
  onOverlayOpenChange: (
    isOpen: boolean,
  ) => void
}

export function TaskPipelineCard({
  task,
  processCode,
  expanded,
  onToggle,
  overlayLocked,
  onOverlayOpenChange,
}: Props) {
  const processTask =
    useMemo(
      () =>
        getProcessTask(
          task,
          processCode,
        ),
      [
        task,
        processCode,
      ],
    )

  const stepStatus =
    processTask.workflowStep?.status ??
    "QUEUE"

  const finalized =
    isWorkflowCompleted(
      task.workflowSteps,
    )

  const isFutureStage =
    stepStatus === "QUEUE"

  const isCompletedStage =
    stepStatus === "REVIEWED"

  const isDimmed =
    isFutureStage ||
    isCompletedStage

  const isReachedStage =
    !isFutureStage &&
    !isCompletedStage

  const handleOverlayOpenChange =
    useCallback(
      (isOpen: boolean) => {
        onOverlayOpenChange(isOpen)
      },
      [
        onOverlayOpenChange,
      ],
    )

  const {
    bind,
    pressed,
    overlayOpen,
    closeOverlay,
  } =
    useTaskCardOverlay({
      enabled:
        expanded &&
        !finalized &&
        isReachedStage &&
        !overlayLocked,
      onOpenChange:
        handleOverlayOpenChange,
    })

  const longPressEnabled =
    expanded &&
    !finalized &&
    isReachedStage

  const [
    commentsOpen,
    setCommentsOpen,
  ] = useState(false)

  // Verificamos si la tarea ya está finalizada o si el paso actual ya fue revisado/completado
  const isFinished = finalized || stepStatus === "REVIEWED"

  return (
    <div
      {...(
        longPressEnabled
          ? bind
          : {}
      )}
      className="relative"
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={
          overlayOpen ||
          overlayLocked
        }
        className="block w-full text-left"
      >
        <div
          className={cn(
            "overflow-hidden rounded-xl transition duration-200 ease-out",
            expanded && "shadow-xl",
            longPressEnabled &&
              pressed &&
              !overlayOpen &&
              "scale-[0.98] shadow-lg",
            isDimmed &&
              "opacity-50",
            overlayLocked &&
              "opacity-40",
          )}
        >
          {expanded ? (
            <div key="expanded" className="animate-comment-in">
              <KanbanCardFromTask
                task={task}
                processCode={processCode}
              />
            </div>
          ) : (
            <div key="compact" className="animate-comment-in">
              <TaskPipelineCardCompact
                processTask={processTask}
              />
            </div>
          )}
        </div>
      </button>

      {!finalized &&
        isReachedStage && (
          <TaskWorkflowOverlay
            processTask={processTask}
            processCode={processCode}
            visible={overlayOpen}
            onClose={closeOverlay}
          />
        )}

      {/* Antes tenía "!isFinished" acá y se ocultaba del todo para
          una tarea/paso finalizado o revisado — pero eso también
          impedía VER el historial de mensajes viejos, no solo
          agregar nuevos. Ahora el ícono sigue disponible siempre
          (para poder abrir el historial), y es CommentHistoryDialog
          el que, en modo readOnly, oculta el composer y las
          acciones de editar/borrar/responder — se puede ver, no
          comentar. */}
      {expanded &&
        !overlayOpen &&
        processTask.workflowStep && (

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setCommentsOpen(true)
            }}
            className={cn(
              "animate-comment-in absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-neutral-300 transition duration-200 ease-out hover:bg-white/15 hover:text-white",
              // No se puede anidar este <button> DENTRO del que
              // envuelve la card (HTML inválido, button-en-button)
              // para que escale como una sola pieza — en vez de eso,
              // se replica acá la misma condición de escala que ya
              // tiene la card, para que se vean sincronizados aunque
              // sean elementos hermanos.
              longPressEnabled &&
                pressed &&
                !overlayOpen &&
                "scale-[0.98]",
            )}
          >
            <MessageCircle size={15} />
          </button>

        )}

      {processTask.workflowStep && (

        <CommentHistoryDialog
          target={{
            scope: "workflowStep",
            workflowStepId: processTask.workflowStep.id,
          }}
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          readOnly={isFinished}
        />

      )}
    </div>
  )
}
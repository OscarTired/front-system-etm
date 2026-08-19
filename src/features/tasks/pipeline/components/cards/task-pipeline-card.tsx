"use client"

import { useCallback, useMemo, useState } from "react"
import { MessageSquare } from "lucide-react"

import { TaskMaterialInfo } from "@/features/tasks/components/task-material-info"
import { CHROME_ICON_BTN } from "@/shared/ui/actions/icon-action"
import { EntityAuditInfo } from "@/shared/ui/entity-audit-info/entity-audit-info"
import { cn } from "@/shared/utils/utils"

import { KanbanCardFromTask } from "@/features/tasks/components/kanban-card/kanban-card-from-task"
import { CommentHistoryDialog } from "@/features/comments/components/comment-history-dialog"
import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import { isWorkflowCompleted } from "@/features/workflow/selectors/is-completed"

import { getProcessTask } from "../../utils/get-process-task"
import { useTaskCardOverlay } from "../../hooks/use-task-card-overlay"
import { TaskPipelineCardCompact } from "./task-pipeline-card-compact"
import { TaskWorkflowOverlay } from "../tasks/task-workflow-overlay"

type Props = {
  task: Task
  processCode: ProcessCode
  expanded: boolean
  dimOthers?: boolean
  onToggle: () => void
  overlayLocked: boolean
  onOverlayOpenChange: (isOpen: boolean) => void
}

export function TaskPipelineCard({
  task,
  processCode,
  expanded,
  dimOthers = false,
  onToggle,
  overlayLocked,
  onOverlayOpenChange,
}: Props) {
  const processTask = useMemo(
    () => getProcessTask(task, processCode),
    [task, processCode]
  )

  const stepStatus = processTask.workflowStep?.status ?? "QUEUE"
  const finalized = isWorkflowCompleted(task.workflowSteps)
  const isFutureStage = stepStatus === "QUEUE"
  const isCompletedStage = stepStatus === "REVIEWED"

  const isDimmed =
    isFutureStage || isCompletedStage || (dimOthers && !expanded)

  const isReachedStage = !isFutureStage && !isCompletedStage

  const handleOverlayOpenChange = useCallback(
    (isOpen: boolean) => {
      onOverlayOpenChange(isOpen)
    },
    [onOverlayOpenChange]
  )

  const { bind, pressed, overlayOpen, closeOverlay, wasRecentlyInteracted } =
    useTaskCardOverlay({
      enabled: expanded && !finalized && isReachedStage && !overlayLocked,
      onOpenChange: handleOverlayOpenChange,
    })

  const longPressEnabled = expanded && !finalized && isReachedStage
  const [commentsOpen, setCommentsOpen] = useState(false)
  const isFinished = finalized || stepStatus === "REVIEWED"

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (overlayOpen || overlayLocked || wasRecentlyInteracted()) return

    const target = event.target as HTMLElement | null
    if (
      target?.closest(
        "button, a, input, textarea, [role='button'], [data-radix-collection-item]"
      )
    ) {
      return
    }

    onToggle()
  }

  return (
    <div {...(longPressEnabled ? bind : {})} className="relative">
      <div
        role="presentation"
        onClick={handleCardClick}
        className={cn(
          "block w-full cursor-pointer text-left",
          (overlayOpen || overlayLocked) && "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-xl transition duration-200 ease-out",
            expanded && "shadow-sm shadow-black/15 dark:shadow-black/40",
            longPressEnabled &&
              pressed &&
              !overlayOpen &&
              "scale-[0.98] shadow-sm shadow-black/15 dark:shadow-black/40",
            isDimmed && "opacity-50",
            overlayLocked && "opacity-40"
          )}
        >
          {expanded ? (
            <div key="expanded" className="animate-comment-in">
              <KanbanCardFromTask
                task={task}
                processCode={processCode}
                hideCommentBadge
                footerActions={
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
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
                        onClick={(event) => {
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
          ) : (
            <div key="compact" className="animate-comment-in">
              <TaskPipelineCardCompact processTask={processTask} />
            </div>
          )}
        </div>
      </div>

      {!finalized && isReachedStage && (
        <TaskWorkflowOverlay
          processTask={processTask}
          processCode={processCode}
          visible={overlayOpen}
          onClose={closeOverlay}
        />
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
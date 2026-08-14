"use client"

import { KanbanCardView } from "./kanban-card-view"

import { taskAccess } from "../../access/task-access"

import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { getWorkflowStep } from "@/features/workflow/selectors/get-workflow-step"

import type { ProcessCode, Task } from "../../types/task.types"
import {
  getTaskMaterialLabel,
  getTaskPiecesTotal,
} from "@/features/tasks/utils/task-material-summary"

type Props={
  task:Task
  processCode?:ProcessCode
  dragPreview?:boolean
  hideCommentBadge?: boolean
}

export function KanbanCardFromTask({
  task,
  processCode,
  dragPreview=false,
  hideCommentBadge=false,
}:Props){

  const stage=taskAccess.stageLabel(task)

  // Si se pasa processCode (uso en el pipeline, donde la misma
  // tarea puede verse en varias columnas a la vez), el estado
  // se calcula por ESE step puntual, ya incluye "QUEUE" cuando
  // corresponde. Sin processCode (ej. ProjectTaskRow), se
  // mantiene el estado global de siempre.
  const workflowStep = processCode
    ? getWorkflowStep(task, processCode)
    : null

  const status =
    processCode
      ? WORKFLOW_STATUS_DEFINITIONS[
          workflowStep?.status ?? "QUEUE"
        ]
      : taskAccess.statusLabel(task)

  // Scope correcto: proceso → step; tarea → task.commentCount
  const commentCount = processCode
    ? (workflowStep?.commentCount ?? 0)
    : (task.commentCount ?? 0)

  return(
    <KanbanCardView
      dragPreview={dragPreview}
      commentCount={commentCount}
      hideCommentBadge={hideCommentBadge}
      priorityName={task.priority.name}
      priorityColor={task.priority.color}
      deliveryDate={task.deliveryDate}
      reference={task.reference}
      lotNumber={task.lotNumber}
      materialName={getTaskMaterialLabel(task)}
      thicknessName={task.thickness.name}
      pieces={getTaskPiecesTotal(task)}
      colorName={task.color?.name}
      colorHex={
        task.color?.color
      }
      stageName={stage.label}
      stageCode={stage.code}
      stageColor={stage.color}
      stageIcon={stage.icon}
      statusName={status.label}
      statusColor={status.color}
      statusIcon={status.icon}
      taskNumber={task.taskNumber}
    />
  )

}
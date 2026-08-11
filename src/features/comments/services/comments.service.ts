import { toast } from "sonner"

import { commentsApi } from "../api/comments.api"
import type { CommentTarget } from "../types/comment.types"

// Evita saturar de toasts si el endpoint falla repetidamente en
// poco tiempo (ej: usuario abriendo varios comment timelines
// seguidos mientras el backend está caído). Pasado el cooldown,
// se vuelve a notificar si falla de nuevo.
let lastProjectReadFailureNotifiedAt = 0

const PROJECT_READ_FAILURE_NOTIFY_COOLDOWN_MS = 5 * 60 * 1000

export const commentsService = {
  getTaskComments: commentsApi.getTaskComments,
  getWorkflowStepComments: commentsApi.getWorkflowStepComments,
  getProjectComments: commentsApi.getProjectComments,
  createTaskComment: commentsApi.createTaskComment,
  createWorkflowStepComment: commentsApi.createWorkflowStepComment,
  createProjectComment: commentsApi.createProjectComment,
  updateComment: commentsApi.updateComment,
  deleteComment: commentsApi.deleteComment,
  getReadStatus: commentsApi.getReadStatus,
  getMyComments: commentsApi.getMyComments,
  markCommentsAsRead(target: CommentTarget) {
    if (target.scope === "task") {
      return commentsApi.markTaskCommentsAsRead(target.taskId)
    }
    if (target.scope === "workflowStep") {
      return commentsApi.markWorkflowStepCommentsAsRead(target.workflowStepId)
    }
    // Los comentarios de proyecto ahora sí generan notificaciones
    // (backend expone POST /projects/:id/comments con menciones y
    // PATCH /projects/:id/comments/read, igual que tasks/workflow-steps).
    return commentsApi.markProjectCommentsAsRead(target.projectId)
      .catch((error) => {

        console.error(
          "[commentsService] markProjectCommentsAsRead failed",
          { projectId: target.projectId, error },
        )

        const now = Date.now()

        const cooldownElapsed =
          now - lastProjectReadFailureNotifiedAt >
          PROJECT_READ_FAILURE_NOTIFY_COOLDOWN_MS

        if (cooldownElapsed) {

          lastProjectReadFailureNotifiedAt = now

          toast.error("No se pudo marcar el comentario como leído")

        }

      })
  },
}
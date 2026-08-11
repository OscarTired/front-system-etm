import type { MyCommentItem } from "../hooks/use-my-comments"

/**
 * Misma lógica que resolveNotificationHref:
 * - proceso → /processes?code=&taskId=&tab=comments
 * - tarea  → /tasks?taskId=&tab=comments
 * - proyecto → /projects?projectId=&tab=comments
 * - history → history=1 (como el Bell)
 */
export function resolveMyCommentHref(
  comment: MyCommentItem,
  opts?: { history?: boolean },
) {
  const focus = crypto.randomUUID()
  const history = opts?.history ?? comment.route?.history ?? false

  const params = new URLSearchParams()
  params.set("focus", focus)
  params.set("tab", "comments")

  if (history) {
    params.set("history", "1")
  }

  const module =
    comment.route?.module ??
    (comment.workflowStepId
      ? "processes"
      : comment.taskId
        ? "tasks"
        : "projects")

  if (module === "processes") {
    const processCode =
      comment.route?.processCode ??
      comment.workflowStep?.processCode
    if (processCode) params.set("code", String(processCode).toLowerCase())
    if (comment.taskId) params.set("taskId", comment.taskId)
    return `/processes?${params.toString()}`
  }

  if (module === "projects") {
    const projectId = comment.projectId ?? comment.project?.id
    if (projectId) params.set("projectId", projectId)
    return `/projects?${params.toString()}`
  }

  if (comment.taskId) params.set("taskId", comment.taskId)
  return `/tasks?${params.toString()}`
}

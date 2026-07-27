import type { Notification } from "../types/notification.types"

type ResolveOptions = {
  history?: boolean
}

export function resolveNotificationHref(
  notification: Notification,
  opts?: ResolveOptions,
) {
  const focus = crypto.randomUUID()
  const history = opts?.history ?? notification.route.history

  const params = new URLSearchParams()
  params.set("focus", focus)

  if (history) {
    params.set("history", "1")
  }

  // Detectar si la notificación es de tipo comentario o mención para abrir en la pestaña de mensajes
  const notificationType = notification.type?.toUpperCase() ?? ""
  const isCommentOrMention = 
    notificationType.includes("COMMENT") || 
    notificationType.includes("MENTION") ||
    notificationType.includes("MESSAGE")

  if (isCommentOrMention) {
    params.set("tab", "comments")
  }

  if (notification.route.module === "processes") {
    const processCode = notification.route.processCode?.toLowerCase()
    if (processCode) params.set("code", processCode)
    if (notification.taskId) params.set("taskId", notification.taskId)
    return `/processes?${params.toString()}`
  }

  if (notification.route.module === "projects") {
    if (notification.projectId) params.set("projectId", notification.projectId)
    return `/projects?${params.toString()}`
  }

  if (notification.taskId) params.set("taskId", notification.taskId)
  return `/tasks?${params.toString()}`
}
import type { NotificationType } from "../types/notification.types"

/** Texto de acción bajo el nombre del actor, según el tipo real. */
export function getNotificationActionLabel(type: NotificationType): string {
  switch (type) {
    case "MENTION":
      return "te mencionó"
    case "COMMENT":
      return "comentó"
    case "TASK_ASSIGNED":
      // Asignación desde la fila (ProcessOperatorCell). El nombre
      // del actor va delante en NotificationItem.
      return "te asignó una tarea"
    case "TASK_SUMMONED":
      // Convocatoria desde TaskAreaPanel / pantalla de asignaciones.
      return "te convocó a una tarea"
    case "TASK_INVITE_ACCEPTED":
      return "aceptó la convocatoria"
    case "TASK_INVITE_DECLINED":
      return "rechazó la convocatoria"
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function isMentionNotification(type: NotificationType): boolean {
  return type === "MENTION"
}

export function isTaskAssignmentNotification(type: NotificationType): boolean {
  return (
    type === "TASK_ASSIGNED" ||
    type === "TASK_SUMMONED" ||
    type === "TASK_INVITE_ACCEPTED" ||
    type === "TASK_INVITE_DECLINED"
  )
}

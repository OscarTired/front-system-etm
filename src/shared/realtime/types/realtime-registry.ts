import type { RealtimeEntity, RealtimeEvent } from "../types/realtime-event"

import { taskHandler } from "../handlers/task-handler"
import { projectHandler } from "../handlers/project-handler"
import { workflowHandler } from "../handlers/workflow-handler"
import { processHandler } from "../handlers/process-handler"
import { userHandler } from "../handlers/user-handler"
import { notificationHandler } from "../handlers/notification-handler"
import { commentHandler } from "../handlers/comment-handler"
import { commentReadStatusHandler } from "../handlers/comment-read-status-handler"
import { activityLogHandler } from "../handlers/activity-log-handler"
import { clientHandler } from "../handlers/client-handler"
import { colorHandler } from "../handlers/color-handler"
import { materialHandler } from "../handlers/material-handler"
import { priorityHandler } from "../handlers/priority-handler"
import { stageHandler } from "../handlers/stage-handler"
import { statusHandler } from "../handlers/status-handler"
import { thicknessHandler } from "../handlers/thickness-handler"
import { rolePermissionsHandler } from "../handlers/role-permissions-handler"

const handlers = {
  TASK: taskHandler,
  PROJECT: projectHandler,
  WORKFLOW: workflowHandler,
  PROCESS: processHandler,
  USER: userHandler,
  NOTIFICATION: notificationHandler,
  COMMENT: commentHandler,
  COMMENT_READ_STATUS: commentReadStatusHandler,
  ACTIVITY_LOG: activityLogHandler,
  CLIENT: clientHandler,
  COLOR: colorHandler,
  MATERIAL: materialHandler,
  PRIORITY: priorityHandler,
  STAGE: stageHandler,
  STATUS: statusHandler,
  THICKNESS: thicknessHandler,
  ROLE_PERMISSIONS: rolePermissionsHandler,
} satisfies Record<RealtimeEntity, (event: RealtimeEvent) => void>

export function realtimeRegistry(
  event: RealtimeEvent,
) {
  const handler = handlers[event.entity]

  if (!handler) {
    return
  }

  handler(event)
}
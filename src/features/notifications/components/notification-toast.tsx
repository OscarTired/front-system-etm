"use client"

import { AtSign, MessageSquare, X } from "lucide-react"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { cn } from "@/shared/utils/utils"

import type { Notification } from "../types/notification.types"
import {
  getNotificationActionLabel,
  isMentionNotification,
} from "../utils/notification-action-label"

type Props = {
  notification: Notification
  onNavigate: () => void
  onDismiss?: () => void
}

/** Mismo ancho/huella que success·error·nesting; texto largo → truncate 1 línea. */
export function NotificationToast({
  notification,
  onNavigate,
  onDismiss,
}: Props) {
  const { actor, task, project, workflowStep } = notification

  const isMention = isMentionNotification(notification.type)
  const actionLabel = getNotificationActionLabel(notification.type)

  const contextLabel =
    task
      ? `${task.project.projectCode} · ${task.project.name}`
      : project
        ? `${project.projectCode} · ${project.name}`
        : ""

  const status = workflowStep
    ? WORKFLOW_STATUS_DEFINITIONS[workflowStep.status]
    : undefined

  return (
    <div
      className={cn(
        "relative flex w-[min(100vw-2rem,22rem)] items-start gap-3 rounded-xl border border-border",
        "bg-card p-3.5 text-left text-foreground shadow-sm shadow-black/15 dark:shadow-black/40",
      )}
    >
      {onDismiss ? (
        <button
          type="button"
          aria-label="Cerrar"
          onClick={e => {
            e.stopPropagation()
            onDismiss()
          }}
          className="absolute -right-1.5 -top-1.5 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:bg-muted/80"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-neutral-700 to-neutral-900 text-xs font-semibold text-foreground">
            {actor.avatarUrl ? (
              <img
                src={actor.avatarUrl}
                alt={actor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              actor.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-popover ring-1 ring-border">
            {isMention ? (
              <AtSign size={9} strokeWidth={3} className="text-primary" />
            ) : (
              <MessageSquare
                size={9}
                strokeWidth={3}
                className="text-muted-foreground"
              />
            )}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm leading-5">
              <span className="font-semibold text-foreground">
                {actor.name}
              </span>
              <span className="ml-1 text-muted-foreground">{actionLabel}</span>
            </p>
            {status ? (
              <div className="origin-top-right scale-85 shrink-0">
                <DynamicBadge
                  compact
                  label={status.label}
                  color={status.color}
                  icon={status.icon}
                />
              </div>
            ) : null}
          </div>

          {contextLabel ? (
            <p className="mt-0.5 truncate text-xs leading-4 text-muted-foreground">
              {contextLabel}
            </p>
          ) : null}

          {notification.messageSnippet ? (
            <p className="mt-1 truncate text-sm leading-5 text-muted-foreground">
              {notification.messageSnippet}
            </p>
          ) : null}
        </div>
      </button>
    </div>
  )
}

"use client"

import { AtSign, MessageSquare } from "lucide-react"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"

import type { Notification } from "../types/notification.types"

type Props = {
  notification: Notification
  onNavigate: () => void
}

export function NotificationToast({
  notification,
  onNavigate,
}: Props) {
  const { actor, task, project, workflowStep } = notification

  const isMention = notification.type === "MENTION"

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
    <button
      type="button"
      onClick={onNavigate}
      className="flex w-full max-w-95 items-start gap-3 text-left"
    >
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-neutral-700 to-neutral-900 text-xs font-semibold text-neutral-200 ring-1 ring-white/10">
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

        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800">
          {isMention ? (
            <AtSign
              size={9}
              strokeWidth={3}
              className="text-cyan-400"
            />
          ) : (
            <MessageSquare
              size={9}
              strokeWidth={3}
              className="text-neutral-300"
            />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm leading-5">
            <span className="font-semibold text-neutral-100">
              {actor.name}
            </span>

            <span className="ml-1 text-neutral-500">
              {isMention ? "te mencionó" : "comentó"}
            </span>
          </p>

          {status && (
            /* Contenedor que reduce el tamaño visual del badge mediante escala */
            <div className="origin-top-right scale-85 shrink-0">
              <DynamicBadge
                compact
                label={status.label}
                color={status.color}
                icon={status.icon}
              />
            </div>
          )}
        </div>

        {contextLabel && (
          <p className="mt-1 truncate text-xs text-neutral-500">
            {contextLabel}
          </p>
        )}

        {workflowStep && (
          <span className="mt-1 inline-flex text-[10px] font-medium uppercase tracking-wide text-neutral-500">
            {workflowStep.processCode}
          </span>
        )}

        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-neutral-300">
          {notification.messageSnippet}
        </p>
      </div>
    </button>
  )
}
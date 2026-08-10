"use client"

import {
  AtSign,
  Check,
  MessageSquare,
  Trash2,
} from "lucide-react"

import { Spinner } from "@/shared/ui/spinner/spinner"

import { cn } from "@/shared/utils/utils"
import { formatNotificationDate } from "../utils/format-notification-date"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"

import type { Notification } from "../types/notification.types"
import {
  getNotificationActionLabel,
  isMentionNotification,
} from "../utils/notification-action-label"

type Props = {
  notification: Notification
  onClick: (notification: Notification) => void | Promise<void>
  onMarkRead?: (id: string) => void | Promise<unknown>
  onDelete?: (notification: Notification) => void

  isSelecting?: boolean

  // Si la tarea de esta notificación está en historial (completada) o
  // activa. Se calcula en el padre (Dialog / Bell) contra la misma
  // cache ["tasks"], con el mismo criterio para todas las notis,
  // tengan o no workflowStep (procesos vs. tareas autosoportadas).
  isHistorical?: boolean

  // Modo confirmación: la tarea de esta notificación está en historial.
  // Mantiene el header (avatar + nombre + acción) y agrega el mensaje
  // de confirmación debajo, en vez de reemplazar todo el item.
  isConfirming?: boolean
  onConfirm?: (notification: Notification) => void | Promise<void>
  onCancelConfirm?: () => void
}

export function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  onDelete,
  isSelecting = false,
  isHistorical,
  isConfirming = false,
  onConfirm,
  onCancelConfirm,
}: Props) {

  const { actor, task, project, workflowStep } = notification

  const isMention = isMentionNotification(notification.type)
  const actionLabel = getNotificationActionLabel(notification.type)

  // Un comentario de proyecto no tiene `task` — el contexto se arma
  // directo desde `project` en ese caso.
  const contextLabel =
    task
      ? `${task.project.projectCode} | ${task.project.name}`
      : project
        ? `${project.projectCode} | ${project.name}`
        : ""

  const status =
    workflowStep
      ? WORKFLOW_STATUS_DEFINITIONS[workflowStep.status]
      : undefined

  if (isConfirming) {

    return (

      <div className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5">

        <div className="relative shrink-0">

          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/5 ring-1 ring-white/8 text-xs font-semibold text-white shadow-inner">

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

        </div>

        <div className="min-w-0 flex-1">

          <span className="block truncate text-sm font-semibold text-neutral-200">
            {actor.name}
          </span>

          <span className="block text-sm text-neutral-400">
            {actionLabel}
          </span>

          <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5">

            <span className="text-xs text-neutral-400">
              {task
                ? "Esta tarea está en el historial"
                : "Este elemento está en el historial"}
            </span>

            <div className="flex shrink-0 items-center gap-1">

              <button
                type="button"
                onClick={onCancelConfirm}
                className="flex h-6 items-center rounded-md px-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-white/8 hover:text-neutral-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => onConfirm?.(notification)}
                className="flex h-6 items-center rounded-md bg-cyan-500/15 px-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/25"
              >
                Ver igual
              </button>

            </div>

          </div>

        </div>

      </div>

    )

  }

  return (

    <button
      type="button"
      disabled={isSelecting}
      onClick={() => onClick(notification)}
      className="group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/5 disabled:pointer-events-none disabled:opacity-70"
    >

      <div className="relative shrink-0">

        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/5 ring-1 ring-white/8 text-xs font-semibold text-white shadow-inner">

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

        <div
          className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#101012] ${
            isMention
              ? "bg-cyan-500"
              : "bg-neutral-600"
          }`}
        >

          {isMention ? (

            <AtSign
              size={9}
              strokeWidth={3}
              className="text-white"
            />

          ) : (

            <MessageSquare
              size={9}
              strokeWidth={3}
              className="text-white"
            />

          )}

        </div>

      </div>

      <div className="min-w-0 flex-1">

        <div className="flex items-start justify-between gap-2">

          <div className="min-w-0 flex-1">

            <span className="block truncate text-sm font-semibold text-neutral-200">
              {actor.name}
            </span>

            <span className="block text-sm text-neutral-400">
              {actionLabel}
            </span>

          </div>

          <div className="flex shrink-0 items-center gap-1.5">

            {status && (

              <div className="origin-right scale-[0.8]">

                <DynamicBadge
                  compact
                  label={status.label}
                  color={status.color}
                  icon={status.icon}
                />

              </div>

            )}

            {!notification.read && onMarkRead && !isSelecting && (

              <span
                role="button"
                tabIndex={0}
                onClick={e => {

                  e.stopPropagation()

                  onMarkRead(notification.id)

                }}
                onKeyDown={e => {

                  if (
                    e.key === "Enter" ||
                    e.key === " "
                  ) {

                    e.preventDefault()
                    e.stopPropagation()

                    onMarkRead(notification.id)

                  }

                }}
                title="Marcar como leída"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 opacity-100 transition-all hover:bg-white/10 hover:text-cyan-300 tablet:opacity-0 tablet:group-hover:opacity-100"
              >

                <Check
                  size={12}
                  strokeWidth={2.5}
                />

              </span>

            )}

            {onDelete && !isSelecting && (

              <span
                role="button"
                tabIndex={0}
                onClick={e => {

                  e.stopPropagation()

                  onDelete(notification)

                }}
                onKeyDown={e => {

                  if (
                    e.key === "Enter" ||
                    e.key === " "
                  ) {

                    e.preventDefault()
                    e.stopPropagation()

                    onDelete(notification)

                  }

                }}
                title="Eliminar notificación"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 tablet:opacity-0 tablet:group-hover:opacity-100"
              >

                <Trash2
                  size={12}
                  strokeWidth={2.5}
                />

              </span>

            )}

            {isSelecting ? (

              <Spinner
                size={13}
                className="text-cyan-400"
              />

            ) : (

              !notification.read && (

                <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />

              )

            )}

          </div>

        </div>

        <p className="mt-1 truncate text-xs text-neutral-500">

          {contextLabel}

        </p>

        <div className="mt-1 flex items-center gap-1">

          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">

            {workflowStep
              ? `PROCESO · ${workflowStep.processCode}`
              : task
                ? "TAREA"
                : "PROYECTO"}

          </span>

          {isHistorical !== undefined && (

            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                isHistorical
                  ? "bg-white/5 text-neutral-500"
                  : "bg-cyan-500/10 text-cyan-400",
              )}
            >

              {isHistorical
                ? "HISTÓRICO"
                : "ACTIVO"}

            </span>

          )}

        </div>

        <p className="mt-1 line-clamp-2 text-sm text-neutral-400">

          {notification.messageSnippet}

        </p>

        <p className="mt-1 text-[11px] text-neutral-600">

          {formatNotificationDate(notification.createdAt)}

        </p>

      </div>

    </button>

  )

}
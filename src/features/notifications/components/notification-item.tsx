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
  isHistorical?: boolean
  isConfirming?: boolean
  onConfirm?: (notification: Notification) => void | Promise<void>
  onCancelConfirm?: () => void
}

/**
 * Composición densa (3 líneas máx, no 6):
 *  1. Avatar | Nombre · acción · hace 20h          [✓][🗑][•]
 *  2.        | código | nombre · PROYECTO · Activo
 *  3.        | snippet
 */
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

  const contextLabel = task
    ? `${task.project.projectCode} | ${task.project.name}`
    : project
      ? `${project.projectCode} | ${project.name}`
      : ""

  const scopeLabel = workflowStep
    ? `PROCESO · ${workflowStep.processCode}`
    : task
      ? "TAREA"
      : "PROYECTO"

  // status disponible si hace falta en el futuro
  void WORKFLOW_STATUS_DEFINITIONS

  const avatar = (
    <div className="relative shrink-0">
      <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-foreground/10 text-[11px] font-semibold text-muted-foreground">
        {actor?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actor.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          (actor?.name?.[0] ?? "?").toUpperCase()
        )}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-popover text-muted-foreground">
        {isMention ? (
          <AtSign size={8} strokeWidth={2.5} />
        ) : (
          <MessageSquare size={8} strokeWidth={2.5} />
        )}
      </span>
    </div>
  )

  if (isConfirming) {
    return (
      <div className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-foreground">
            <span className="font-semibold text-foreground">{actor?.name}</span>
            <span className="text-muted-foreground"> · histórico</span>
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            ¿Abrir este ítem del historial?
          </p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => onConfirm?.(notification)}
              className="rounded-md bg-foreground/10 px-2 py-1 text-[11px] font-medium text-foreground"
            >
              Abrir
            </button>
            <button
              type="button"
              onClick={() => onCancelConfirm?.()}
              className="rounded-md px-2 py-1 text-[11px] text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={cn(
        "group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
        "hover:bg-foreground/5",
        isSelecting && "opacity-70",
      )}
    >
      {avatar}

      <div className="min-w-0 flex-1">
        {/* L1: nombre · acción · tiempo  +  acciones */}
        <div className="flex items-center gap-1">
          <p className="min-w-0 flex-1 truncate text-xs leading-4 text-foreground">
            <span className="font-semibold text-foreground">{actor?.name}</span>
            <span className="text-muted-foreground"> · {actionLabel}</span>
            <span className="text-muted-foreground/80">
              {" "}
              · {formatNotificationDate(notification.createdAt)}
            </span>
          </p>

          {onMarkRead && !notification.read && (
            <span
              role="button"
              tabIndex={0}
              title="Marcar leída"
              onClick={e => {
                e.stopPropagation()
                void onMarkRead(notification.id)
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  void onMarkRead(notification.id)
                }
              }}
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground opacity-100 transition hover:bg-foreground/10 hover:text-foreground tablet:opacity-0 tablet:group-hover:opacity-100"
            >
              <Check size={11} strokeWidth={2.5} />
            </span>
          )}

          {onDelete && (
            <span
              role="button"
              tabIndex={0}
              title="Eliminar"
              onClick={e => {
                e.stopPropagation()
                onDelete(notification)
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(notification)
                }
              }}
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground opacity-100 transition hover:bg-red-500/10 hover:text-red-400 tablet:opacity-0 tablet:group-hover:opacity-100"
            >
              <Trash2 size={11} strokeWidth={2.5} />
            </span>
          )}

          {isSelecting ? (
            <Spinner size={12} className="shrink-0 text-primary" />
          ) : (
            !notification.read && (
              <span className="size-1.5 shrink-0 rounded-full bg-cyan-400" />
            )
          )}
        </div>

        {/* L2: contexto + scope + activo en UNA fila */}
        {(contextLabel || isHistorical !== undefined) && (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
            {contextLabel && (
              <span className="min-w-0 truncate">{contextLabel}</span>
            )}
            <span className="shrink-0 text-muted-foreground/80">·</span>
            <span className="shrink-0 uppercase tracking-wide text-[10px] text-muted-foreground">
              {scopeLabel}
            </span>
            {isHistorical !== undefined && (
              <>
                <span className="shrink-0 text-muted-foreground/80">·</span>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-medium uppercase tracking-wide",
                    isHistorical ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {isHistorical ? "Histórico" : "Activo"}
                </span>
              </>
            )}
          </p>
        )}

        {/* L3: snippet una sola línea */}
        {notification.messageSnippet ? (
          <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-muted-foreground">
            {notification.messageSnippet}
          </p>
        ) : null}
      </div>
    </button>
  )
}

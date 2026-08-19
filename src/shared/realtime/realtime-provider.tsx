"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  fetchEventSource,
  EventStreamContentType,
} from "@microsoft/fetch-event-source"

import { authSession } from "@/lib/auth-session"
import { apiBaseUrl } from "@/lib/api-url"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { useMarkNotificationRead } from "@/features/notifications/hooks/use-mark-notification-read"

import { NotificationToast } from "@/features/notifications/components/notification-toast"
import { resolveNotificationHref } from "@/features/notifications/utils/resolve-notification-href"
import type { Notification } from "@/features/notifications/types/notification.types"
import { isViewingNotificationTarget } from "@/features/comments/store/active-comment-context-store"

import { realtimeRegistry } from "./types/realtime-registry"

const RECONNECT_INVALIDATE_THRESHOLD_MS = 15_000

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {

  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { markAsRead } = useMarkNotificationRead()

  useEffect(() => {

    if (!user) {
      return
    }

    const token = authSession.get()

    if (!token) {
      return
    }

    const controller = new AbortController()
    let stale = false
    let hasConnectedOnce = false
    let disconnectedAt: number | null = null

    fetchEventSource(
      `${apiBaseUrl}/realtime/events`,
      {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        openWhenHidden: true,

        async onopen(response) {
          if (
            response.ok &&
            response.headers
              .get("content-type")
              ?.includes(EventStreamContentType)
          ) {
            if (hasConnectedOnce) {
              const downtimeMs = disconnectedAt
                ? Date.now() - disconnectedAt
                : 0

              if (downtimeMs >= RECONNECT_INVALIDATE_THRESHOLD_MS) {
                queryClient.invalidateQueries()
              }
            }

            hasConnectedOnce = true
            disconnectedAt = null
            return
          }

          if (response.status === 401) {
            authSession.set(null)
            useAuthStore.getState().logout()

            if (typeof window !== "undefined") {
              window.location.href = "/login"
            }
          }

          throw new Error(`Realtime ${response.status}`)
        },

        onmessage(message) {
          if (stale) return

          if (!message.data || message.data.trim() === "") {
            return
          }

          const event = JSON.parse(message.data)

          if (event.type === "PING") {
            return
          }

          realtimeRegistry(event)

          if (
            event.entity === "NOTIFICATION" &&
            event.action === "CREATED"
          ) {
            const notification = event.payload as Notification

            // Si ya estás mirando el mismo hilo (el composer/timeline
            // de esa tarea/paso/proyecto está abierto ahora mismo),
            // el toast es ruido — ya la estás viendo aparecer en la
            // conversación misma. La notificación se guarda igual
            // (eso ya lo maneja notificationHandler arriba), esto
            // solo decide si además se anuncia con un toast.
            const alreadyViewing = isViewingNotificationTarget({
              taskId: notification.taskId,
              projectId: notification.projectId,
              workflowStepId: notification.workflowStepId,
            })

            if (!alreadyViewing) {

              toast.custom(
                (id) => (
                  <NotificationToast
                    notification={notification}
                    onDismiss={() => toast.dismiss(id)}
                    onNavigate={async () => {
                      if (!notification.read) {
                        await markAsRead(notification.id)
                      }

                      router.push(
                        resolveNotificationHref(notification),
                      )

                      toast.dismiss(id)
                    }}
                  />
                ),
                {
                  id: `notification:${notification.id}`,
                  duration: Infinity,
                  // unstyled + ancho fijo = misma huella que success/error/nesting.
                  unstyled: true,
                  className:
                    "!w-[min(100vw-2rem,22rem)] !max-w-[min(100vw-2rem,22rem)] border-0 bg-transparent p-0 shadow-none",
                },
              )

            } else if (!notification.read) {

              // Ya la está viendo aparecer en vivo en la
              // conversación misma — que no le quede pendiente en la
              // campana algo que ya tiene delante de los ojos.
              markAsRead(notification.id)

            }
          }
        },

        onclose() {
          if (disconnectedAt === null) {
            disconnectedAt = Date.now()
          }
        },

        onerror(error) {
          if (controller.signal.aborted) {
            throw error
          }

          if (!authSession.get()) {
            throw error
          }

          if (disconnectedAt === null) {
            disconnectedAt = Date.now()
          }
        },
      },
    )

    return () => {
      stale = true
      controller.abort()
    }
  }, [user, queryClient, markAsRead])

  return <>{children}</>
}
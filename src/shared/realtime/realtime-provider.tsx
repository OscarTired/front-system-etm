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

            toast.custom(
              (id) => (
                <NotificationToast
                  notification={notification}
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
              },
            )
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
import type { InfiniteData } from "@tanstack/react-query"
import type { Notification, NotificationsPage } from "@/features/notifications/types/notification.types"
import { toast } from "sonner"

import { getQueryClient } from "@/lib/query-client"

import type { RealtimeEvent } from "../types/realtime-event"
import { consumePendingSelfDeletion } from "../pending-self-deletions"
import { isViewingNotificationTarget } from "@/features/comments/store/active-comment-context-store"

const MAX_TRACKED_IDS = 200
const recentlyCountedIds = new Set<string>()

function markCountedOnce(id: string): boolean {
  if (recentlyCountedIds.has(id)) {
    return false
  }

  recentlyCountedIds.add(id)

  if (recentlyCountedIds.size > MAX_TRACKED_IDS) {
    const oldest = recentlyCountedIds.values().next().value
    if (oldest !== undefined) {
      recentlyCountedIds.delete(oldest)
    }
  }

  return true
}

export function notificationHandler(
  event: RealtimeEvent,
) {
  const queryClient = getQueryClient()

  switch (event.action) {
    case "CREATED": {
      const notification = event.payload as Notification

      // Si ya está mirando ese mismo hilo (composer/timeline
      // abiertos ahora mismo), ni el contador se toca ni se guarda
      // como no-leída — directo entra como leída. Antes esto se
      // "corregía" después con una mutación async (markAsRead en
      // RealtimeProvider), que igual servía para persistirlo en el
      // server, pero acá en el cache local dejaba un parpadeo del
      // contador subiendo a 1 y bajando de nuevo cuando la mutación
      // volvía — a veces visible, y si la mutación tardaba/fallaba,
      // quedaba pegado en 1.
      const alreadyViewing = isViewingNotificationTarget({
        taskId: notification.taskId,
        projectId: notification.projectId,
        workflowStepId: notification.workflowStepId,
      })

      if (!alreadyViewing && markCountedOnce(notification.id)) {
        queryClient.setQueryData<number>(
          ["notifications", "unread-count"],
          current => (current ?? 0) + 1,
        )
      }

      const notificationToStore =
        alreadyViewing
          ? { ...notification, read: true }
          : notification

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        ["notifications"],
        current => {
          if (!current) return current

          const alreadyExists = current.pages.some(page =>
            page.items.some(n => n.id === notificationToStore.id),
          )

          if (alreadyExists) return current

          const [firstPage, ...rest] = current.pages

          return {
            ...current,
            pages: [
              { ...firstPage, items: [notificationToStore, ...firstPage.items] },
              ...rest,
            ],
          }
        },
      )

      return
    }

    case "BULK_READ": {
      const payload = event.payload as { ids: string[] } | undefined
      if (!payload) return
      const idSet = new Set(payload.ids)
      let readNowCount = 0

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        ["notifications"],
        current => {
          if (!current) return current
          return {
            ...current,
            pages: current.pages.map(page => ({
              ...page,
              items: page.items.map(n => {
                if (idSet.has(n.id) && !n.read) {
                  readNowCount += 1
                  toast.dismiss(`notification:${n.id}`)
                  return { ...n, read: true }
                }
                return n
              }),
            })),
          }
        },
      )

      if (readNowCount > 0) {
        queryClient.setQueryData<number>(
          ["notifications", "unread-count"],
          current => Math.max(0, (current ?? 0) - readNowCount),
        )
      }
      return
    }

    case "DELETED": {
      const payload = event.payload as { id: string } | undefined
      if (!payload) return

      toast.dismiss(`notification:${payload.id}`)

      if (consumePendingSelfDeletion(payload.id)) {
        return
      }

      let wasUnread = true
      const cachedList = queryClient.getQueryData<InfiniteData<NotificationsPage>>(["notifications"])

      if (cachedList) {
        const cached = cachedList.pages
          .flatMap(page => page.items)
          .find(n => n.id === payload.id)

        if (cached) {
          wasUnread = !cached.read
        }
      }

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        ["notifications"],
        current => {
          if (!current) return current

          return {
            ...current,
            pages: current.pages.map(page => ({
              ...page,
              items: page.items.filter(n => n.id !== payload.id),
            })),
          }
        },
      )

      if (wasUnread) {
        queryClient.setQueryData<number>(
          ["notifications", "unread-count"],
          current => Math.max(0, (current ?? 0) - 1),
        )
      }

      return
    }

    case "DELETED_ALL": {
      toast.dismiss()

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        ["notifications"],
        current => {
          if (!current) return current

          return {
            ...current,
            pages: current.pages.map(page => ({ ...page, items: [] })),
          }
        },
      )

      queryClient.setQueryData<number>(["notifications", "unread-count"], 0)

      return
    }
  }
}
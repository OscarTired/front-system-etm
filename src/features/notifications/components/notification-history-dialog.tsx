"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eraser, History, Search, Trash2 } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { preventNestedDialogClose } from "@/shared/ui/dialogs/prevent-nested-dialog-close"

import { useNotifications } from "../hooks/use-notifications"
import { useMarkNotificationRead } from "../hooks/use-mark-notification-read"
import { useMarkAllNotificationsRead } from "../hooks/use-mark-all-read"
import { useDeleteNotification } from "../hooks/use-delete-notification"
import { useDeleteAllNotifications } from "../hooks/use-delete-all-notifications"
import { NotificationItem } from "./notification-item"
import { resolveNotificationHref } from "../utils/resolve-notification-href"

import type { Notification } from "../types/notification.types"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationHistoryDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState("")
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Notification | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const router = useRouter()

  const { notifications, loading, loadMore, hasMore, loadingMore } = useNotifications(open)
  const { markAsRead } = useMarkNotificationRead()
  const { markAllAsRead } = useMarkAllNotificationsRead()
  const { deleteNotification } = useDeleteNotification()
  const { deleteAll } = useDeleteAllNotifications()

  const filteredNotifications = search.trim()
    ? notifications.filter(n => {
        const projectRef = n.task?.project ?? n.project

        return (
          n.messageSnippet.toLowerCase().includes(search.toLowerCase()) ||
          n.actor.name.toLowerCase().includes(search.toLowerCase()) ||
          (projectRef?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (projectRef?.projectCode.toLowerCase().includes(search.toLowerCase()) ?? false)
        )
      })
    : notifications

  const hasUnread = notifications.some(n => !n.read)
  const hasAny = notifications.length > 0

  const handleSelect = (notification: Notification) => {
    if (notification.route.history) {
      setConfirmingId(notification.id)
      return
    }

    proceedToNotification(notification)
  }

  const proceedToNotification = (
    notification: Notification,
    fromConfirm = false,
  ) => {
    setConfirmingId(null)

    if (!notification.read) {
      markAsRead(notification.id)
    }

    onOpenChange(false)

    router.push(
      resolveNotificationHref(notification, { history: fromConfirm }),
    )
  }

  const handleConfirmDeleteAll = async () => {
    await deleteAll()
    setConfirmDeleteAll(false)
  }

  const handleConfirmDeleteOne = async () => {
    if (!pendingDelete) {
      return
    }

    await deleteNotification(
      pendingDelete,
    )

    setPendingDelete(
      null,
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size="large"
          className="flex h-[min(40rem,85dvh)] max-h-[85dvh] w-full max-w-180 flex-col overflow-hidden rounded-2xl p-0 text-foreground shadow-2xl"
          onPointerDownOutside={preventNestedDialogClose}
          onInteractOutside={preventNestedDialogClose}
        >
          <DialogHeader className="shrink-0 px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <History
                  size={18}
                  strokeWidth={2.4}
                />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Notificaciones
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Lista completa de notificaciones
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="shrink-0 px-5 py-3">
            <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2">
              <Search size={15} className="shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en notificaciones..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-4">
            {loading ? (
              <div className="flex min-h-65 flex-col items-center justify-center gap-2.5">
                <Spinner size={18} />
                <p className="text-sm text-muted-foreground">Cargando...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex min-h-65 flex-col items-center justify-center gap-1.5 text-center">
                <p className="text-sm text-muted-foreground">No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isHistorical={notification.route.history}
                    onClick={handleSelect}
                    onMarkRead={markAsRead}
                    onDelete={setPendingDelete}
                    isConfirming={confirmingId === notification.id}
                    onConfirm={n => proceedToNotification(n, true)}
                    onCancelConfirm={() => setConfirmingId(null)}
                  />
                ))}

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => loadMore()}
                    disabled={loadingMore}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
                  >
                    {loadingMore
                      ? <Spinner size={12} />
                      : "Cargar más"}
                  </button>
                )}
              </div>
            )}
          </div>
          </ScrollArea>

          <div className="shrink-0 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    title="Marcar todas como leídas"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-cyan-300"
                  >
                    <Eraser size={16} />
                  </button>
                )}

                {hasAny && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(true)}
                    title="Eliminar todas las notificaciones"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl bg-foreground/5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-white/20 hover:bg-foreground/10 hover:text-foreground"
              >
                Cerrar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ActionDialog
        open={confirmDeleteAll}
        title="Eliminar todas las notificaciones"
        description="¿Eliminar todas las notificaciones? Esta acción no se puede deshacer."
        icon={Trash2}
        confirmLabel="Eliminar todas"
        variant="danger"
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={handleConfirmDeleteAll}
      />

      <ActionDialog
        open={!!pendingDelete}
        title="Eliminar notificación"
        description={
          pendingDelete
            ? `¿Eliminar la notificación de ${pendingDelete.actor.name}? Esta acción no se puede deshacer.`
            : ""
        }
        icon={Trash2}
        confirmLabel="Eliminar"
        variant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDeleteOne}
      />
    </>
  )
}
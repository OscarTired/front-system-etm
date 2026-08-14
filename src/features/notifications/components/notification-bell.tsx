"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Eraser, Bell, History, CheckCircle2 } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"
import { toast } from "sonner"

import { cn } from "@/shared/utils/utils"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useManagedOverlay } from "@/shared/stores/hooks/use-managed-overlay"
import { SidebarRow } from "@/shared/responsive/layout/sidebar/sidebar-row"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FormDialogHeader } from "@/shared/ui/dialogs/form-dialog/form-dialog-header"

import { useNotifications } from "../hooks/use-notifications"
import { useUnreadCount } from "../hooks/use-unread-count"
import { useMarkNotificationRead } from "../hooks/use-mark-notification-read"
import { useMarkAllNotificationsRead } from "../hooks/use-mark-all-read"
import { NotificationItem } from "./notification-item"
import { NotificationHistoryDialog } from "./notification-history-dialog"
import { resolveNotificationHref } from "../utils/resolve-notification-href"

import type { Notification } from "../types/notification.types"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
  collapsed?: boolean
  isDrawer?: boolean
  variant?: "sidebar" | "topbar"
}

export function NotificationBell({
  collapsed,
  isDrawer = false,
  variant = "sidebar",
}: Props) {
  const { open, setOpen } = useManagedOverlay("notifications")

  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const router = useRouter()
  const sidebarMode = useSidebarStore(s => s.mode)

  const {
    notifications,
    loading,
  } = useNotifications(open)

  const { count } = useUnreadCount()
  const { markAsRead } = useMarkNotificationRead()
  const { markAllAsRead } = useMarkAllNotificationsRead()

  const visibleNotifications = notifications.filter(n => !n.read)
  const isTopbar = variant === "topbar"

  useEffect(() => {
    if (isTopbar) return
    if (sidebarMode === "closed") {
      setOpen(false)
    }
  }, [sidebarMode, isTopbar, setOpen])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      toast.dismiss()
    }
    setOpen(nextOpen)
  }

  const handleSelect = async (notification: Notification) => {
    if (notification.route.history) {
      setConfirmingId(notification.id)
      return
    }
    await proceedToNotification(notification)
  }

  const proceedToNotification = async (
    notification: Notification,
    fromConfirm = false,
  ) => {
    setSelectingId(notification.id)
    setConfirmingId(null)

    try {
      if (!notification.read) {
        await markAsRead(notification.id)
      }
      setOpen(false)
      router.push(resolveNotificationHref(notification, { history: fromConfirm }))
    } finally {
      setSelectingId(null)
    }
  }

  const handleOpenHistory = () => {
    setOpen(false)
    setHistoryOpen(true)
  }

  const renderTriggerContent = () => {
    if (isTopbar) {
      return (
        <button
          type="button"
          aria-label="Notificaciones"
          onClick={() => handleOpenChange(!open)}
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-foreground/15 active:bg-foreground/20",
            open && "bg-foreground/20 text-foreground",
          )}
        >
          <Bell size={16} strokeWidth={2} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-[10px]">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      )
    }

    return (
      <button
        type="button"
        title={collapsed ? "Notificaciones" : undefined}
        className="w-full text-left"
      >
        <SidebarRow
          icon={Bell}
          label="Notificaciones"
          collapsed={collapsed}
          active={open}
          count={count > 0 ? (count > 9 ? "9+" : count) : undefined}
          collapsedBadgeColor="bg-primary text-primary-foreground"
          badgeColor="bg-primary text-primary-foreground"
          badgeAnimated={count > 0}
        />
      </button>
    )
  }

  const panelBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-end px-5 pb-2">
        <button
          type="button"
          onClick={() => markAllAsRead()}
          disabled={loading || visibleNotifications.length === 0}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-cyan-700 dark:hover:text-primary disabled:cursor-not-allowed disabled:text-muted-foreground/70 disabled:hover:bg-transparent"
        >
          <Eraser size={13} />
          Limpiar
        </button>
      </div>

      {/*
        Una sola caja de altura: la define el estado vacío (sizer).
        Loading y lista se pintan en el mismo rectángulo (absolute inset-0).
        Sin h-52 / max-h-96 / números mágicos.
      */}
      <div className="relative min-h-0 w-full flex-1">
        <div
          className="invisible flex flex-col items-center justify-center gap-2 px-2 py-14 text-center"
          aria-hidden
        >
          <div className="size-10 shrink-0 rounded-full" />
          <p className="text-xs font-medium">
            No tienes notificaciones pendientes
          </p>
        </div>

        <ScrollArea className="absolute inset-0 overscroll-contain px-2 pb-2">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Spinner size={20} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Cargando notificaciones...
              </p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
                <Bell size={18} />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                No tienes notificaciones pendientes
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {visibleNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isHistorical={notification.route.history}
                  onClick={handleSelect}
                  onMarkRead={markAsRead}
                  isSelecting={selectingId === notification.id}
                  isConfirming={confirmingId === notification.id}
                  onConfirm={n => proceedToNotification(n, true)}
                  onCancelConfirm={() => setConfirmingId(null)}
                />
              ))}

            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer: misma altura siempre (una sola fila de acción) */}
      <div className="flex h-10 shrink-0 items-center justify-center p-2 select-none">
        {notifications.length === 0 && !loading ? (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 size={13} className="shrink-0 text-muted-foreground/80" />
            Estás al día
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenHistory}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <History size={13} />
            Ver más
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {isTopbar ? (
        <>
          {renderTriggerContent()}

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
              size="large"
              className="flex flex-col overflow-hidden rounded-2xl p-0 text-foreground shadow-2xl"
            >
              <FormDialogHeader title="Notificaciones" icon={Bell} />
              {panelBody}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{renderTriggerContent()}</PopoverTrigger>

          <PopoverContent
            data-sidebar-popover
            side="right"
            align="start"
            sideOffset={8}
            className="z-40 flex w-full min-w-90 max-w-lg flex-col overflow-hidden p-0 border-none text-foreground shadow-xl select-none"
          >
            <div className="flex shrink-0 items-center px-3.5 pt-3">
              <span className="text-sm font-semibold text-foreground">
                Notificaciones
              </span>
            </div>
            {panelBody}
          </PopoverContent>
        </Popover>
      )}

      <NotificationHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Eraser, Bell, History, CheckCircle2 } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"
import { toast } from "sonner"

import { cn } from "@/shared/utils/utils"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useManagedOverlay } from "@/shared/stores/hooks/use-managed-overlay"
import { SidebarRow, sidebarRowClassName } from "@/shared/responsive/layout/sidebar/sidebar-row"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { useNotifications } from "../hooks/use-notifications"
import { useUnreadCount } from "../hooks/use-unread-count"
import { useMarkNotificationRead } from "../hooks/use-mark-notification-read"
import { useMarkAllNotificationsRead } from "../hooks/use-mark-all-read"
import { NotificationItem } from "./notification-item"
import { NotificationHistoryDialog } from "./notification-history-dialog"
import { resolveNotificationHref } from "../utils/resolve-notification-href"

import type { Notification } from "../types/notification.types"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

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
    loadMore,
    hasMore,
    loadingMore,
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
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-neutral-300 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15 active:bg-white/20",
            open && "bg-white/20 text-white",
          )}
        >
          <Bell size={17} strokeWidth={2.2} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/15 font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      )
    }

    if (isDrawer) {
      return (
        <button
          type="button"
          className={cn(
            open
              ? "bg-white/15 text-white"
              : "text-neutral-300 hover:bg-white/5 hover:text-white active:bg-white/10 active:text-white",
          )}
        >
          <SidebarRow
            icon={Bell}
            label="Notificaciones"
            active={open}
            count={count > 0 ? count : undefined}
            isDrawer
          />
        </button>
      )
    }

    if (collapsed) {
      return (
        <button
          type="button"
          title="Notificaciones"
          className={cn(
            sidebarRowClassName({ collapsed: true, active: open }),
            "size-8 shrink-0 p-0 mx-auto",
          )}
        >
          <SidebarRow
            icon={Bell}
            label="Notificaciones"
            collapsed
            active={open}
            count={count > 0 ? (count > 9 ? "9+" : count) : undefined}
            collapsedBadgeColor="bg-cyan-500 text-white"
          />
        </button>
      )
    }

    return (
      <button
        type="button"
        className={cn(sidebarRowClassName({ active: open }), "w-[calc(100%-8px)]")}
      >
        <SidebarRow
          icon={Bell}
          label="Notificaciones"
          active={open}
          count={count > 0 ? (count > 9 ? "9+" : count) : undefined}
          badgeColor="bg-cyan-500 text-white"
          badgeAnimated={count > 0}
        />
      </button>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{renderTriggerContent()}</PopoverTrigger>

        <PopoverContent
          data-sidebar-popover
          side={isTopbar ? "bottom" : "right"}
          align={isTopbar ? "end" : "start"}
          sideOffset={8}
          className="z-40 flex flex-col w-full min-w-90 max-w-lg p-0 border-none bg-[#171717] text-white shadow-xl select-none"
        >
          <div className="flex shrink-0 items-center justify-between px-3.5 py-3">
            <span className="text-sm font-semibold text-neutral-200">
              Notificaciones
            </span>

            <button
              type="button"
              onClick={() => markAllAsRead()}
              disabled={visibleNotifications.length === 0}
              title="Limpiar notificaciones"
              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/8 hover:text-cyan-300 disabled:cursor-not-allowed disabled:text-neutral-700 disabled:hover:bg-transparent"
            >
              <Eraser size={14} />
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <VerticalScroll className="px-2 pb-2 h-full" style={{ minHeight: 180, maxHeight: 384 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <Spinner size={20} className="text-neutral-400" />
                  <p className="text-xs text-neutral-500">Cargando notificaciones...</p>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white/5 text-neutral-500">
                    <Bell size={18} />
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">No tienes notificaciones pendientes</p>
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

                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => loadMore()}
                      disabled={loadingMore}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 disabled:opacity-50"
                    >
                      {loadingMore ? <Spinner size={12} /> : "Cargar más"}
                    </button>
                  )}
                </div>
              )}
            </VerticalScroll>
          </div>

          <div className="shrink-0 p-2 select-none">
            {visibleNotifications.length === 0 ? (
              <div className="flex w-full items-center justify-center gap-1.5 py-1.5 text-center text-xs text-neutral-500">
                <CheckCircle2 size={13} className="text-neutral-600 shrink-0" />
                Estás al día
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenHistory}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
              >
                <History size={13} />
                Ver más
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <NotificationHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  )
}